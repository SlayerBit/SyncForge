package com.syncforge.common.event;

import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
public abstract class DomainEvent {
    private final UUID eventId;
    private final Instant timestamp;
    private final UUID actorId;
    private final UUID workspaceId;

    protected DomainEvent(UUID actorId, UUID workspaceId) {
        this.eventId = UUID.randomUUID();
        this.timestamp = Instant.now();
        this.actorId = actorId;
        this.workspaceId = workspaceId;
    }
}
