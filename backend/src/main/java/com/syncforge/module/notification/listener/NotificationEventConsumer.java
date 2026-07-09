package com.syncforge.module.notification.listener;

import com.syncforge.module.comment.domain.Mention;
import com.syncforge.module.comment.repository.MentionRepository;
import com.syncforge.module.comment.event.CommentCreated;
import com.syncforge.module.notification.domain.NotificationType;
import com.syncforge.module.notification.service.NotificationService;
import com.syncforge.module.task.event.TaskAssigned;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.event.MemberInvited;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final NotificationService notificationService;
    private final MentionRepository mentionRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskAssigned(TaskAssigned event) {
        log.info("Processing TaskAssigned notification for user: {}", event.getAssigneeId());
        String title = "Assigned to Task";
        String message = "You have been assigned to task " + event.getTaskIdentifier() + ".";

        notificationService.createNotification(
                event.getAssigneeId(),
                NotificationType.TASK_ASSIGNED,
                title,
                message,
                "Task",
                event.getTaskId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentCreated(CommentCreated event) {
        log.info("Processing CommentCreated mentions for comment: {}", event.getCommentId());
        // Find if this comment triggered any mentions
        List<Mention> mentions = mentionRepository.findByCommentId(event.getCommentId());
        User author = userRepository.findById(event.getAuthorId()).orElse(null);
        String authorName = author != null ? author.getDisplayName() : "Someone";

        for (Mention mention : mentions) {
            // Check if the user is not the author of the comment (don't notify oneself)
            if (!mention.getMentionedUser().getId().equals(event.getAuthorId())) {
                notificationService.createNotification(
                        mention.getMentionedUser().getId(),
                        NotificationType.TASK_MENTION,
                        "Mentioned in Task",
                        authorName + " mentioned you in a comment.",
                        "Task",
                        event.getTaskId()
                );
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberInvited(MemberInvited event) {
        log.info("Processing MemberInvited notification for email: {}", event.getEmail());
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(event.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Workspace workspace = workspaceRepository.findById(event.getWorkspaceId()).orElse(null);
            String wsName = workspace != null ? workspace.getName() : "a workspace";

            notificationService.createNotification(
                    user.getId(),
                    NotificationType.WORKSPACE_INVITATION,
                    "Workspace Invitation",
                    "You have been invited to join " + wsName + ".",
                    "WorkspaceInvitation",
                    event.getInvitationId()
            );
        }
    }
}
