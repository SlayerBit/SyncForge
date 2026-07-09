package com.syncforge.module.comment.service.impl;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.comment.domain.Comment;
import com.syncforge.module.comment.domain.Mention;
import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.comment.dto.CreateCommentRequest;
import com.syncforge.module.comment.dto.UpdateCommentRequest;
import com.syncforge.module.comment.event.CommentCreated;
import com.syncforge.module.comment.event.CommentDeleted;
import com.syncforge.module.comment.event.CommentUpdated;
import com.syncforge.module.comment.mapper.CommentMapper;
import com.syncforge.module.comment.repository.CommentRepository;
import com.syncforge.module.comment.repository.MentionRepository;
import com.syncforge.module.comment.service.CommentService;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.repository.TaskRepository;
import com.syncforge.module.task.service.CommentCountProvider;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.dto.UserSummaryDto;
import com.syncforge.module.user.mapper.UserMapper;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService, CommentCountProvider {

    private final CommentRepository commentRepository;
    private final MentionRepository mentionRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final ApplicationEventPublisher eventPublisher;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([^\\s@]+)");

    @Override
    @Transactional
    public CommentDto createComment(UUID taskId, CreateCommentRequest request, UUID authorId) {
        log.info("Creating comment on task: {} by user: {}", taskId, authorId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", authorId));

        Comment comment = new Comment(task, author, request.content());
        commentRepository.save(comment);

        // Parse mentions
        parseAndSaveMentions(comment);

        // Event
        eventPublisher.publishEvent(new CommentCreated(
                comment.getId(), taskId, authorId, comment.getContent(), task.getBoard().getId(), task.getBoard().getWorkspace().getId()));

        return commentMapper.toDto(comment, userMapper.toSummaryDto(author));
    }

    @Override
    @Transactional(readOnly = true)
    public CommentDto getComment(UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));
        return commentMapper.toDto(comment, userMapper.toSummaryDto(comment.getAuthor()));
    }

    private void parseAndSaveMentions(Comment comment) {
        String content = comment.getContent();
        if (content == null || content.isEmpty()) {
            return;
        }

        UUID workspaceId = comment.getTask().getBoard().getWorkspace().getId();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        Set<String> matchedNames = new HashSet<>();
        while (matcher.find()) {
            matchedNames.add(matcher.group(1));
        }

        for (String name : matchedNames) {
            // Find user by display name or email
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(name);
            if (userOpt.isEmpty()) {
                // Try display name lookup (since query is simple, we check list or custom query. Let's do list of users or database search)
                // In a production environment, display name is checked. Let's search by email or exact name.
                // We'll search case-insensitive on display name
                userOpt = userRepository.findAll().stream()
                        .filter(u -> u.getDisplayName().equalsIgnoreCase(name))
                        .findFirst();
            }

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Verify user is in workspace
                if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
                    Mention mention = new Mention(comment, user);
                    mentionRepository.save(mention);
                    log.info("Saved mention for user: {} in comment: {}", user.getId(), comment.getId());
                }
            }
        }
    }

    @Override
    @Transactional
    public CommentDto updateComment(UUID commentId, UpdateCommentRequest request, UUID authorId) {
        log.info("Updating comment: {}", commentId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new BusinessException("You can only edit your own comments.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        if (!Objects.equals(comment.getVersion(), request.version())) {
            throw new ObjectOptimisticLockingFailureException(Comment.class, commentId);
        }

        // Edit window check: 15 minutes
        if (Duration.between(comment.getCreatedAt(), Instant.now()).toMinutes() > 15) {
            throw new BusinessException("Comments can only be edited within 15 minutes of creation.", "EDIT_WINDOW_EXPIRED", HttpStatus.BAD_REQUEST);
        }

        comment.update(request.content());
        commentRepository.save(comment);

        // Re-evaluate mentions (delete old, save new)
        List<Mention> oldMentions = mentionRepository.findByCommentId(commentId);
        mentionRepository.deleteAll(oldMentions);
        parseAndSaveMentions(comment);

        // Event
        eventPublisher.publishEvent(new CommentUpdated(
                commentId, comment.getTask().getId(), comment.getTask().getBoard().getId(), comment.getTask().getBoard().getWorkspace().getId(), authorId));

        return commentMapper.toDto(comment, userMapper.toSummaryDto(comment.getAuthor()));
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, UUID authorId) {
        log.info("Soft-deleting comment: {}", commentId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new BusinessException("You can only delete your own comments.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        // Edit window check: 15 minutes
        if (Duration.between(comment.getCreatedAt(), Instant.now()).toMinutes() > 15) {
            throw new BusinessException("Comments can only be deleted within 15 minutes of creation.", "EDIT_WINDOW_EXPIRED", HttpStatus.BAD_REQUEST);
        }

        comment.softDelete();
        commentRepository.save(comment);

        // Delete mentions
        List<Mention> mentions = mentionRepository.findByCommentId(commentId);
        mentionRepository.deleteAll(mentions);

        // Event
        eventPublisher.publishEvent(new CommentDeleted(
                commentId, comment.getTask().getId(), comment.getTask().getBoard().getId(), comment.getTask().getBoard().getWorkspace().getId(), authorId));
    }

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<CommentDto> getTaskComments(UUID taskId, UUID cursor, int size) {
        PageRequest pageRequest = PageRequest.of(0, size);
        Slice<Comment> slice;
        if (cursor == null) {
            slice = commentRepository.findByTaskIdFirstPage(taskId, pageRequest);
        } else {
            slice = commentRepository.findByTaskIdWithCursor(taskId, cursor, pageRequest);
        }

        List<CommentDto> dtos = slice.getContent().stream()
                .map(c -> commentMapper.toDto(c, userMapper.toSummaryDto(c.getAuthor())))
                .collect(Collectors.toList());

        String nextCursor = null;
        if (slice.hasNext() && !dtos.isEmpty()) {
            nextCursor = dtos.get(dtos.size() - 1).id().toString();
        }

        return CursorResponse.of(dtos, nextCursor, slice.hasNext());
    }

    @Override
    @Transactional(readOnly = true)
    public int getCommentCount(UUID taskId) {
        return (int) commentRepository.countByTaskIdAndDeletedFalse(taskId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Integer> getCommentCounts(Set<UUID> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> counts = commentRepository.countNonDeletedCommentsForTasks(taskIds);
        Map<UUID, Integer> map = taskIds.stream().collect(Collectors.toMap(id -> id, id -> 0));
        for (Object[] row : counts) {
            map.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return map;
    }
}
