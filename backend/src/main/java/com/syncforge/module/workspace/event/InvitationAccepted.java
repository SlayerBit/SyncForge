package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class InvitationAccepted extends DomainEvent {
    private final UUID workspaceId;
    private final UUID userId;
    private final String role;

    public InvitationAccepted(UUID workspaceId, UUID userId, String role) {
        super(userId, workspaceId);
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.role = role;
    }
}
