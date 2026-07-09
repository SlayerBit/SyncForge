package com.syncforge.module.task.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.common.response.PagedResponse;
import com.syncforge.module.board.dto.BoardDetailDto;
import com.syncforge.module.board.dto.BoardDto;
import com.syncforge.module.board.dto.ColumnDto;
import com.syncforge.module.board.service.BoardService;
import com.syncforge.module.task.dto.*;
import com.syncforge.module.task.service.TaskService;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task and label management APIs")
public class TaskController {

    private final TaskService taskService;
    private final BoardService boardService;
    private final WorkspaceAuthorizationService authService;

    @PostMapping("/columns/{columnId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a task in a column")
    public ApiResponse<TaskDto> createTask(
            @PathVariable UUID columnId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTaskRequest request) {
        ColumnDto column = boardService.getColumn(columnId);
        BoardDto board = boardService.getBoard(column.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        TaskDto task = taskService.createTask(columnId, request, principal.getId());
        return ApiResponse.created(task);
    }

    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "Get task details")
    public ApiResponse<TaskDto> getTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.VIEWER);

        return ApiResponse.ok(task);
    }

    @PatchMapping("/tasks/{taskId}")
    @Operation(summary = "Update task details")
    public ApiResponse<TaskDto> updateTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateTaskRequest request) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        TaskDto updated = taskService.updateTask(taskId, request, principal.getId());
        return ApiResponse.ok(updated);
    }

    @PostMapping("/tasks/{taskId}/move")
    @Operation(summary = "Move task to another position/column")
    public ApiResponse<TaskDto> moveTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MoveTaskRequest request) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.moveTask(taskId, request, principal.getId());
        return ApiResponse.ok(taskService.getTask(taskId));
    }

    @PostMapping("/tasks/{taskId}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Archive a task")
    public void archiveTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.archiveTask(taskId, principal.getId());
    }

    @PostMapping("/tasks/{taskId}/assign")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Assign user to task")
    public void assignUser(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, UUID> body) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.assignUser(taskId, body.get("userId"), principal.getId());
    }

    @DeleteMapping("/tasks/{taskId}/assignees/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove user assignment from task")
    public void unassignUser(
            @PathVariable UUID taskId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.unassignUser(taskId, userId, principal.getId());
    }

    @PostMapping("/tasks/{taskId}/labels/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Add label to task")
    public void addLabel(
            @PathVariable UUID taskId,
            @PathVariable UUID labelId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.addLabelToTask(taskId, labelId, principal.getId());
    }

    @DeleteMapping("/tasks/{taskId}/labels/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove label from task")
    public void removeLabel(
            @PathVariable UUID taskId,
            @PathVariable UUID labelId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskDto task = taskService.getTask(taskId);
        BoardDto board = boardService.getBoard(task.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);

        taskService.removeLabelFromTask(taskId, labelId, principal.getId());
    }

    @GetMapping("/boards/{boardId}/tasks")
    @Operation(summary = "List board tasks with sorting and filtering")
    public ApiResponse<PagedResponse<TaskDto>> getBoardTasks(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "priority", required = false) String priority,
            @RequestParam(name = "assigneeId", required = false) UUID assigneeId,
            @RequestParam(name = "labelId", required = false) UUID labelId,
            @RequestParam(name = "archived", required = false, defaultValue = "false") boolean archived,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestParam(name = "sort", defaultValue = "position,asc") String sortParam) {
        BoardDto board = boardService.getBoard(boardId);
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.VIEWER);

        String[] sortParts = sortParam.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        PagedResponse<TaskDto> tasks = taskService.getFilteredTasks(boardId, status, priority, assigneeId, labelId, archived, pageable);
        return ApiResponse.ok(tasks);
    }

    @PostMapping("/workspaces/{workspaceId}/labels")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create workspace label")
    public ApiResponse<LabelDto> createLabel(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLabelRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.MEMBER);
        LabelDto label = taskService.createLabel(workspaceId, request);
        return ApiResponse.created(label);
    }

    @GetMapping("/workspaces/{workspaceId}/labels")
    @Operation(summary = "List workspace labels")
    public ApiResponse<List<LabelDto>> getWorkspaceLabels(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        List<LabelDto> labels = taskService.getWorkspaceLabels(workspaceId);
        return ApiResponse.ok(labels);
    }

    @DeleteMapping("/labels/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete workspace label")
    public void deleteLabel(
            @PathVariable UUID labelId,
            @AuthenticationPrincipal UserPrincipal principal) {
        LabelDto label = taskService.getLabel(labelId);
        authService.checkPermission(principal.getId(), label.workspaceId(), WorkspaceRole.ADMIN);
        taskService.deleteLabel(labelId);
    }

    @GetMapping("/boards/{boardId}")
    @Operation(summary = "Get board with columns and tasks")
    public ApiResponse<BoardWithTasksDto> getBoardDetail(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal UserPrincipal principal) {
        BoardDto board = boardService.getBoard(boardId);
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.VIEWER);

        BoardDetailDto detailDto = boardService.getBoardWithColumns(boardId);
        List<TaskDto> activeTasks = taskService.getBoardTasks(boardId, false);

        Map<UUID, List<TaskDto>> tasksByColumn = activeTasks.stream()
                .collect(Collectors.groupingBy(TaskDto::columnId));

        List<ColumnWithTasksDto> columns = detailDto.columns().stream()
                .map(col -> new ColumnWithTasksDto(
                        col.id(),
                        col.name(),
                        col.position(),
                        col.taskLimit(),
                        tasksByColumn.getOrDefault(col.id(), Collections.emptyList()),
                        col.createdAt(),
                        col.updatedAt()
                ))
                .collect(Collectors.toList());

        BoardWithTasksDto boardWithTasks = new BoardWithTasksDto(
                detailDto.id(),
                detailDto.workspaceId(),
                detailDto.name(),
                detailDto.description(),
                detailDto.prefix(),
                detailDto.archived(),
                detailDto.version(),
                columns,
                detailDto.createdAt(),
                detailDto.updatedAt()
        );

        return ApiResponse.ok(boardWithTasks);
    }
}
