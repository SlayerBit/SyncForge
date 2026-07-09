package com.syncforge.module.workspace.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class WorkspaceCreated extends DomainEvent {
    private final UUID workspaceId;
    private final String name;
    private final String slug;
    private final UUID ownerId;

    public WorkspaceCreated(UUID workspaceId, String name, String slug, UUID ownerId) {
        super(ownerId, workspaceId);
        this.workspaceId = workspaceId;
        this.name = name;
        this.slug = slug;
        this.ownerId = ownerId;
    }
}
