package com.syncforge.module.board.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class ColumnReordered extends DomainEvent {
    private final UUID columnId;
    private final UUID boardId;
    private final String newPosition;

    public ColumnReordered(UUID columnId, UUID boardId, UUID workspaceId, String newPosition, UUID actorId) {
        super(actorId, workspaceId);
        this.columnId = columnId;
        this.boardId = boardId;
        this.newPosition = newPosition;
    }
}
