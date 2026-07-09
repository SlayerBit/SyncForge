package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class TaskMoved extends DomainEvent {
    private final UUID taskId;
    private final UUID boardId;
    private final UUID fromColumnId;
    private final UUID toColumnId;
    private final String newPosition;

    public TaskMoved(UUID taskId, UUID boardId, UUID workspaceId, UUID fromColumnId, UUID toColumnId, String newPosition, UUID actorId) {
        super(actorId, workspaceId);
        this.taskId = taskId;
        this.boardId = boardId;
        this.fromColumnId = fromColumnId;
        this.toColumnId = toColumnId;
        this.newPosition = newPosition;
    }
}
