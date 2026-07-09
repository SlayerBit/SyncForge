package com.syncforge.module.auth.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class PasswordResetCompleted extends DomainEvent {
    private final UUID userId;

    public PasswordResetCompleted(UUID userId) {
        super(userId, null);
        this.userId = userId;
    }
}
