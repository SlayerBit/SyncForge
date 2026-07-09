package com.syncforge.module.realtime.service;

import java.util.List;
import java.util.UUID;

public interface PresenceService {
    void markOnline(UUID workspaceId, UUID userId);
    void markOffline(UUID workspaceId, UUID userId);
    List<UUID> getOnlineUsers(UUID workspaceId);
}
