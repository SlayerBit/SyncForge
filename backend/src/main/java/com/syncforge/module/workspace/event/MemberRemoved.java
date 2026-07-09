package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class MemberRemoved extends DomainEvent {
    private final UUID workspaceId;
    private final UUID userId;
    private final UUID removedBy;

    public MemberRemoved(UUID workspaceId, UUID userId, UUID removedBy) {
        super(removedBy, workspaceId);
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.removedBy = removedBy;
    }
}
