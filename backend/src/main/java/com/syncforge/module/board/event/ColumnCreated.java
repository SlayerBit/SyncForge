package com.syncforge.module.board.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class ColumnCreated extends DomainEvent {
    private final UUID columnId;
    private final UUID boardId;
    private final String name;
    private final String position;

    public ColumnCreated(UUID columnId, UUID boardId, UUID workspaceId, String name, String position, UUID actorId) {
        super(actorId, workspaceId);
        this.columnId = columnId;
        this.boardId = boardId;
        this.name = name;
        this.position = position;
    }
}
