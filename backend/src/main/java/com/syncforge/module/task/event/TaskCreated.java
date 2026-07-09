package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class TaskCreated extends DomainEvent {
    private final UUID taskId;
    private final UUID boardId;
    private final UUID columnId;
    private final String identifier;
    private final String title;

    public TaskCreated(UUID taskId, UUID boardId, UUID columnId, UUID workspaceId, String identifier, String title, UUID creatorId) {
        super(creatorId, workspaceId);
        this.taskId = taskId;
        this.boardId = boardId;
        this.columnId = columnId;
        this.identifier = identifier;
        this.title = title;
    }
}
