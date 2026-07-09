package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class TaskArchived extends DomainEvent {
    private final UUID taskId;
    private final UUID boardId;

    public TaskArchived(UUID taskId, UUID boardId, UUID workspaceId, UUID actorId) {
        super(actorId, workspaceId);
        this.taskId = taskId;
        this.boardId = boardId;
    }
}
