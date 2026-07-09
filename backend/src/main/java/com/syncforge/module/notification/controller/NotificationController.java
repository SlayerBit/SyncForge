package com.syncforge.module.notification.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.notification.dto.NotificationDto;
import com.syncforge.module.notification.service.NotificationService;
import com.syncforge.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get user notifications with cursor pagination")
    public ApiResponse<CursorResponse<NotificationDto>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "cursor", required = false) UUID cursor,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        CursorResponse<NotificationDto> notifications = notificationService.getUserNotifications(principal.getId(), cursor, size);
        return ApiResponse.ok(notifications);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get current user unread notification count")
    public ApiResponse<Map<String, Integer>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        int count = notificationService.getUnreadCount(principal.getId());
        return ApiResponse.ok(Map.of("unreadCount", count));
    }

    @RequestMapping(value = "/{notificationId}/read", method = {RequestMethod.POST, RequestMethod.PATCH})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Mark a specific notification as read")
    public void markRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(notificationId, principal.getId());
    }

    @PostMapping({"/read-all", "/mark-all-read"})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Mark all user notifications as read")
    public void markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a specific notification")
    public void deleteNotification(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(notificationId, principal.getId());
    }
}
