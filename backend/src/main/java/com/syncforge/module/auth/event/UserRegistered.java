package com.syncforge.module.auth.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UserRegistered extends DomainEvent {
    private final UUID userId;
    private final String email;
    private final String displayName;

    public UserRegistered(UUID userId, String email, String displayName) {
        super(userId, null);
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
    }
}
