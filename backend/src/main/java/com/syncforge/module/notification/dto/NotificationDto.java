package com.syncforge.module.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        UUID userId,
        String type,
        String title,
        String message,
        String referenceType,
        UUID referenceId,
        boolean read,
        Instant createdAt
) {}
