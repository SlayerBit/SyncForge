package com.syncforge.module.comment.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.comment.dto.CreateCommentRequest;
import com.syncforge.module.comment.dto.UpdateCommentRequest;
import com.syncforge.module.comment.service.CommentService;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.repository.TaskRepository;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Task comment management APIs")
public class CommentController {

    private final CommentService commentService;
    private final TaskRepository taskRepository;
    private final WorkspaceAuthorizationService authService;
    private final com.syncforge.module.comment.repository.CommentRepository commentRepository;

    @PostMapping("/tasks/{taskId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a comment to a task")
    public ApiResponse<CommentDto> createComment(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCommentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new com.syncforge.common.exception.ResourceNotFoundException("Task", taskId));
        authService.checkPermission(principal.getId(), task.getBoard().getWorkspace().getId(), WorkspaceRole.MEMBER);

        CommentDto comment = commentService.createComment(taskId, request, principal.getId());
        return ApiResponse.created(comment);
    }

    @GetMapping("/tasks/{taskId}/comments")
    @Operation(summary = "List task comments with cursor pagination")
    public ApiResponse<CursorResponse<CommentDto>> getComments(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "cursor", required = false) UUID cursor,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new com.syncforge.common.exception.ResourceNotFoundException("Task", taskId));
        authService.checkPermission(principal.getId(), task.getBoard().getWorkspace().getId(), WorkspaceRole.VIEWER);

        CursorResponse<CommentDto> comments = commentService.getTaskComments(taskId, cursor, size);
        return ApiResponse.ok(comments);
    }

    @PatchMapping("/comments/{commentId}")
    @Operation(summary = "Update comment content")
    public ApiResponse<CommentDto> updateComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateCommentRequest request) {
        com.syncforge.module.comment.domain.Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new com.syncforge.common.exception.ResourceNotFoundException("Comment", commentId));
        authService.checkPermission(principal.getId(), comment.getTask().getBoard().getWorkspace().getId(), WorkspaceRole.MEMBER);

        CommentDto updated = commentService.updateComment(commentId, request, principal.getId());
        return ApiResponse.ok(updated);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete comment")
    public void deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        com.syncforge.module.comment.domain.Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new com.syncforge.common.exception.ResourceNotFoundException("Comment", commentId));
        authService.checkPermission(principal.getId(), comment.getTask().getBoard().getWorkspace().getId(), WorkspaceRole.MEMBER);

        commentService.deleteComment(commentId, principal.getId());
    }
}
