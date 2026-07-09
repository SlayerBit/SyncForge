package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class MemberInvited extends DomainEvent {
    private final UUID workspaceId;
    private final String email;
    private final String role;
    private final UUID invitedBy;
    private final UUID invitationId;

    public MemberInvited(UUID workspaceId, String email, String role, UUID invitedBy, UUID invitationId) {
        super(invitedBy, workspaceId);
        this.workspaceId = workspaceId;
        this.email = email;
        this.role = role;
        this.invitedBy = invitedBy;
        this.invitationId = invitationId;
    }
}
