package com.syncforge.module.activity.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.activity.dto.ActivityLogDto;
import com.syncforge.module.activity.service.ActivityService;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.repository.TaskRepository;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Activity", description = "Activity timeline logging and auditing APIs")
public class ActivityController {

    private final ActivityService activityService;
    private final TaskRepository taskRepository;
    private final WorkspaceAuthorizationService authService;

    @GetMapping("/workspaces/{workspaceId}/activity")
    @Operation(summary = "Get workspace activity log with cursor pagination")
    public ApiResponse<CursorResponse<ActivityLogDto>> getWorkspaceActivity(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "cursor", required = false) UUID cursor,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        CursorResponse<ActivityLogDto> activity = activityService.getWorkspaceActivity(workspaceId, cursor, size);
        return ApiResponse.ok(activity);
    }

    @GetMapping("/tasks/{taskId}/activity")
    @Operation(summary = "Get activity log history for a specific task")
    public ApiResponse<List<ActivityLogDto>> getTaskActivity(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new com.syncforge.common.exception.ResourceNotFoundException("Task", taskId));
        authService.checkPermission(principal.getId(), task.getBoard().getWorkspace().getId(), WorkspaceRole.VIEWER);

        List<ActivityLogDto> activity = activityService.getEntityActivity("Task", taskId);
        return ApiResponse.ok(activity);
    }
}
