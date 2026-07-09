package com.syncforge.module.board.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class BoardUpdated extends DomainEvent {
    private final UUID boardId;
    private final UUID workspaceId;
    private final String name;
    private final String description;

    public BoardUpdated(UUID boardId, UUID workspaceId, String name, String description, UUID actorId) {
        super(actorId, workspaceId);
        this.boardId = boardId;
        this.workspaceId = workspaceId;
        this.name = name;
        this.description = description;
    }
}
