package com.syncforge.module.board.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class BoardArchived extends DomainEvent {
    private final UUID boardId;
    private final UUID workspaceId;

    public BoardArchived(UUID boardId, UUID workspaceId, UUID actorId) {
        super(actorId, workspaceId);
        this.boardId = boardId;
        this.workspaceId = workspaceId;
    }
}
