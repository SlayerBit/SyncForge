package com.syncforge.module.notification.event;

import com.syncforge.common.event.DomainEvent;
import com.syncforge.module.notification.dto.NotificationDto;
import lombok.Getter;

import java.util.UUID;

@Getter
public class NotificationCreated extends DomainEvent {
    private final NotificationDto notification;
    private final String email;

    public NotificationCreated(NotificationDto notification, String email) {
        super(notification.userId(), null);
        this.notification = notification;
        this.email = email;
    }
}
