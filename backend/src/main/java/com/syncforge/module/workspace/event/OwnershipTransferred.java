package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class OwnershipTransferred extends DomainEvent {
    private final UUID workspaceId;
    private final UUID previousOwnerId;
    private final UUID newOwnerId;

    public OwnershipTransferred(UUID workspaceId, UUID previousOwnerId, UUID newOwnerId) {
        super(previousOwnerId, workspaceId);
        this.workspaceId = workspaceId;
        this.previousOwnerId = previousOwnerId;
        this.newOwnerId = newOwnerId;
    }
}
