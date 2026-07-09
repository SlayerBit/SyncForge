package com.syncforge.module.activity.listener;

import com.syncforge.module.activity.service.ActivityService;
import com.syncforge.module.workspace.event.*;
import com.syncforge.module.board.event.*;
import com.syncforge.module.task.event.*;
import com.syncforge.module.comment.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityEventConsumer {

    private final ActivityService activityService;

    // WORKSPACE EVENTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWorkspaceCreated(WorkspaceCreated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "CREATE",
                Map.of("name", event.getName(), "slug", event.getSlug()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberInvited(MemberInvited event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "INVITE_MEMBER",
                Map.of("email", event.getEmail(), "role", event.getRole()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleInvitationAccepted(InvitationAccepted event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "ACCEPT_INVITATION",
                Map.of("userId", event.getUserId(), "role", event.getRole()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberRemoved(MemberRemoved event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "REMOVE_MEMBER",
                Map.of("userId", event.getUserId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberRoleChanged(MemberRoleChanged event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "CHANGE_MEMBER_ROLE",
                Map.of("userId", event.getUserId(), "oldRole", event.getOldRole(), "newRole", event.getNewRole()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOwnershipTransferred(OwnershipTransferred event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Workspace", event.getWorkspaceId(), "TRANSFER_OWNERSHIP",
                Map.of("previousOwnerId", event.getPreviousOwnerId(), "newOwnerId", event.getNewOwnerId()));
    }

    // BOARD EVENTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBoardCreated(BoardCreated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Board", event.getBoardId(), "CREATE",
                Map.of("name", event.getName()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBoardUpdated(BoardUpdated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Board", event.getBoardId(), "UPDATE",
                Map.of("name", event.getName()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBoardArchived(BoardArchived event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Board", event.getBoardId(), "ARCHIVE", Map.of());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleColumnCreated(ColumnCreated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Column", event.getColumnId(), "CREATE",
                Map.of("boardId", event.getBoardId(), "name", event.getName()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleColumnReordered(ColumnReordered event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Column", event.getColumnId(), "REORDER",
                Map.of("boardId", event.getBoardId(), "position", event.getNewPosition()));
    }

    // TASK EVENTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskCreated(TaskCreated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "CREATE",
                Map.of("boardId", event.getBoardId(), "columnId", event.getColumnId(), "identifier", event.getIdentifier(), "title", event.getTitle()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskUpdated(TaskUpdated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "UPDATE", Map.of());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskMoved(TaskMoved event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "MOVE",
                Map.of("fromColumnId", event.getFromColumnId(), "toColumnId", event.getToColumnId(), "position", event.getNewPosition()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskArchived(TaskArchived event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "ARCHIVE", Map.of());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskAssigned(TaskAssigned event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "ASSIGN",
                Map.of("assigneeId", event.getAssigneeId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskUnassigned(TaskUnassigned event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "UNASSIGN",
                Map.of("userId", event.getUserId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleLabelAdded(LabelAdded event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "ADD_LABEL",
                Map.of("labelId", event.getLabelId(), "labelName", event.getLabelName()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleLabelRemoved(LabelRemoved event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Task", event.getTaskId(), "REMOVE_LABEL",
                Map.of("labelId", event.getLabelId(), "labelName", event.getLabelName()));
    }

    // COMMENT EVENTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentCreated(CommentCreated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Comment", event.getCommentId(), "CREATE_COMMENT",
                Map.of("taskId", event.getTaskId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentUpdated(CommentUpdated event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Comment", event.getCommentId(), "UPDATE_COMMENT",
                Map.of("taskId", event.getTaskId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentDeleted(CommentDeleted event) {
        activityService.logActivity(event.getWorkspaceId(), event.getActorId(), "Comment", event.getCommentId(), "DELETE_COMMENT",
                Map.of("taskId", event.getTaskId()));
    }
}
