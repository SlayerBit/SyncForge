package com.syncforge.module.auth.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class PasswordResetRequested extends DomainEvent {
    private final UUID userId;
    private final String email;

    public PasswordResetRequested(UUID userId, String email) {
        super(userId, null);
        this.userId = userId;
        this.email = email;
    }
}
