package com.syncforge.module.notification.service.impl;

import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.notification.domain.Notification;
import com.syncforge.module.notification.domain.NotificationType;
import com.syncforge.module.notification.dto.NotificationDto;
import com.syncforge.module.notification.mapper.NotificationMapper;
import com.syncforge.module.notification.repository.NotificationRepository;
import com.syncforge.module.notification.service.NotificationService;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    private static final String UNREAD_CACHE_PREFIX = "notification:unread:%s";

    private void incrementUnreadCache(UUID userId) {
        try {
            String key = String.format(UNREAD_CACHE_PREFIX, userId);
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.opsForValue().increment(key);
            } else {
                // Initialize cache
                int count = (int) notificationRepository.countByUserIdAndReadFalse(userId);
                redisTemplate.opsForValue().set(key, count, Duration.ofHours(24));
            }
        } catch (Exception e) {
            log.warn("Redis error incrementing unread cache: {}", e.getMessage());
        }
    }

    private void decrementUnreadCache(UUID userId) {
        try {
            String key = String.format(UNREAD_CACHE_PREFIX, userId);
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.opsForValue().decrement(key);
            } else {
                int count = (int) notificationRepository.countByUserIdAndReadFalse(userId);
                redisTemplate.opsForValue().set(key, count, Duration.ofHours(24));
            }
        } catch (Exception e) {
            log.warn("Redis error decrementing unread cache: {}", e.getMessage());
        }
    }

    private void clearUnreadCache(UUID userId) {
        try {
            String key = String.format(UNREAD_CACHE_PREFIX, userId);
            redisTemplate.opsForValue().set(key, 0, Duration.ofHours(24));
        } catch (Exception e) {
            log.warn("Redis error clearing unread cache: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public NotificationDto createNotification(UUID userId, NotificationType type, String title, String message, String referenceType, UUID referenceId) {
        log.info("Creating notification for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Notification notification = new Notification(user, type, title, message, referenceType, referenceId);
        notificationRepository.save(notification);

        // Update count cache
        incrementUnreadCache(userId);

        // Trigger real-time push event or publish to STOMP topic
        NotificationDto dto = notificationMapper.toDto(notification);

        // Publish event for WebSocket real-time broadcast
        eventPublisher.publishEvent(new com.syncforge.module.notification.event.NotificationCreated(dto, user.getEmail()));

        return dto;
    }

    @Override
    @Transactional
    public void markRead(UUID notificationId, UUID userId) {
        log.info("Marking notification read: {}", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found for user.");
        }

        if (!notification.isRead()) {
            notification.markRead();
            notificationRepository.save(notification);
            decrementUnreadCache(userId);
        }
    }

    @Override
    @Transactional
    public void markAllRead(UUID userId) {
        log.info("Marking all notifications read for user: {}", userId);
        notificationRepository.markAllReadForUser(userId);
        clearUnreadCache(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<NotificationDto> getUserNotifications(UUID userId, UUID cursor, int size) {
        PageRequest pageRequest = PageRequest.of(0, size);
        Slice<Notification> slice;
        if (cursor == null) {
            slice = notificationRepository.findByUserIdFirstPage(userId, pageRequest);
        } else {
            slice = notificationRepository.findByUserIdWithCursor(userId, cursor, pageRequest);
        }

        List<NotificationDto> dtos = slice.getContent().stream()
                .map(notificationMapper::toDto)
                .collect(Collectors.toList());

        String nextCursor = null;
        if (slice.hasNext() && !dtos.isEmpty()) {
            nextCursor = dtos.get(dtos.size() - 1).id().toString();
        }

        return CursorResponse.of(dtos, nextCursor, slice.hasNext());
    }

    @Override
    @Transactional(readOnly = true)
    public int getUnreadCount(UUID userId) {
        String key = String.format(UNREAD_CACHE_PREFIX, userId);
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                return Integer.parseInt(cached.toString());
            }
        } catch (Exception e) {
            log.warn("Redis error reading unread cache: {}", e.getMessage());
        }

        int count = (int) notificationRepository.countByUserIdAndReadFalse(userId);
        try {
            redisTemplate.opsForValue().set(key, count, Duration.ofHours(24));
        } catch (Exception e) {
            log.warn("Redis error caching unread count: {}", e.getMessage());
        }
        return count;
    }
}
