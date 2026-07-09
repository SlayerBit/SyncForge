package com.syncforge.module.task.service;

import com.syncforge.module.task.dto.*;
import com.syncforge.module.user.dto.UserSummaryDto;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    TaskDto createTask(UUID columnId, CreateTaskRequest request, UUID creatorId);
    TaskDto getTask(UUID taskId);
    TaskDto updateTask(UUID taskId, UpdateTaskRequest request, UUID actorId);
    void archiveTask(UUID taskId, UUID actorId);
    void moveTask(UUID taskId, MoveTaskRequest request, UUID actorId);
    List<TaskDto> getColumnTasks(UUID columnId);
    List<TaskDto> getBoardTasks(UUID boardId, boolean includeArchived);
    com.syncforge.common.response.PagedResponse<TaskDto> getFilteredTasks(UUID boardId, String status, String priority, UUID assigneeId, UUID labelId, Boolean archived, org.springframework.data.domain.Pageable pageable);

    void assignUser(UUID taskId, UUID userId, UUID actorId);
    void unassignUser(UUID taskId, UUID userId, UUID actorId);
    List<UserSummaryDto> getAssignees(UUID taskId);

    LabelDto createLabel(UUID workspaceId, CreateLabelRequest request);
    LabelDto getLabel(UUID labelId);
    void deleteLabel(UUID labelId);
    List<LabelDto> getWorkspaceLabels(UUID workspaceId);
    void addLabelToTask(UUID taskId, UUID labelId, UUID actorId);
    void removeLabelFromTask(UUID taskId, UUID labelId, UUID actorId);
}
