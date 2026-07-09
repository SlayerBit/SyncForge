package com.syncforge.module.realtime.service.impl;

import com.syncforge.module.realtime.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceServiceImpl implements PresenceService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String PRESENCE_KEY_PATTERN = "presence:%s:*";
    private static final String PRESENCE_KEY_FORMAT = "presence:%s:%s";

    @Override
    public void markOnline(UUID workspaceId, UUID userId) {
        String key = String.format(PRESENCE_KEY_FORMAT, workspaceId, userId);
        redisTemplate.opsForValue().set(key, "online", Duration.ofSeconds(30));
        log.debug("User {} marked online in workspace {}", userId, workspaceId);

        broadcastPresence(workspaceId);
    }

    @Override
    public void markOffline(UUID workspaceId, UUID userId) {
        String key = String.format(PRESENCE_KEY_FORMAT, workspaceId, userId);
        redisTemplate.delete(key);
        log.debug("User {} marked offline in workspace {}", userId, workspaceId);

        broadcastPresence(workspaceId);
    }

    @Override
    public List<UUID> getOnlineUsers(UUID workspaceId) {
        String pattern = String.format("presence:%s:*", workspaceId);
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys == null || keys.isEmpty()) {
            return Collections.emptyList();
        }

        return keys.stream()
                .map(key -> {
                    String[] parts = key.split(":");
                    return UUID.fromString(parts[parts.length - 1]);
                })
                .collect(Collectors.toList());
    }

    private void broadcastPresence(UUID workspaceId) {
        List<UUID> onlineUsers = getOnlineUsers(workspaceId);
        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/presence", onlineUsers);
    }
}
