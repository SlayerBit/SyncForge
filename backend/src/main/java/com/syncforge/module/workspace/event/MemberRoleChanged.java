package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class MemberRoleChanged extends DomainEvent {
    private final UUID workspaceId;
    private final UUID userId;
    private final String oldRole;
    private final String newRole;
    private final UUID changedBy;

    public MemberRoleChanged(UUID workspaceId, UUID userId, String oldRole, String newRole, UUID changedBy) {
        super(changedBy, workspaceId);
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.changedBy = changedBy;
    }
}
