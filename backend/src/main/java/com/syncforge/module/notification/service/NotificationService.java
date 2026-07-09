package com.syncforge.module.notification.service;

import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.notification.domain.NotificationType;
import com.syncforge.module.notification.dto.NotificationDto;

import java.util.UUID;

public interface NotificationService {
    NotificationDto createNotification(UUID userId, NotificationType type, String title, String message, String referenceType, UUID referenceId);
    void markRead(UUID notificationId, UUID userId);
    void markAllRead(UUID userId);
    void deleteNotification(UUID notificationId, UUID userId);
    CursorResponse<NotificationDto> getUserNotifications(UUID userId, UUID cursor, int size);
    int getUnreadCount(UUID userId);
}
