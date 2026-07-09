package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class TaskAssigned extends DomainEvent {
    private final UUID taskId;
    private final UUID assigneeId;
    private final UUID boardId;
    private final String taskIdentifier;

    public TaskAssigned(UUID taskId, UUID assigneeId, UUID assignedBy, UUID boardId, UUID workspaceId, String taskIdentifier) {
        super(assignedBy, workspaceId);
        this.taskId = taskId;
        this.assigneeId = assigneeId;
        this.boardId = boardId;
        this.taskIdentifier = taskIdentifier;
    }
}
