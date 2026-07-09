package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class TaskUnassigned extends DomainEvent {
    private final UUID taskId;
    private final UUID userId;
    private final UUID boardId;

    public TaskUnassigned(UUID taskId, UUID userId, UUID boardId, UUID workspaceId, UUID actorId) {
        super(actorId, workspaceId);
        this.taskId = taskId;
        this.userId = userId;
        this.boardId = boardId;
    }
}
