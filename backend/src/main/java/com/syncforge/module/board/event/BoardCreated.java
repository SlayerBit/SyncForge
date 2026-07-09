package com.syncforge.module.board.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class BoardCreated extends DomainEvent {
    private final UUID boardId;
    private final UUID workspaceId;
    private final String name;
    private final UUID creatorId;

    public BoardCreated(UUID boardId, UUID workspaceId, String name, UUID creatorId) {
        super(creatorId, workspaceId);
        this.boardId = boardId;
        this.workspaceId = workspaceId;
        this.name = name;
        this.creatorId = creatorId;
    }
}
