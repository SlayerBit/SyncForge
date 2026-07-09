package com.syncforge.module.activity.service;

import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.activity.dto.ActivityLogDto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ActivityService {
    void logActivity(UUID workspaceId, UUID actorId, String entityType, UUID entityId, String action, Map<String, Object> changes);
    CursorResponse<ActivityLogDto> getWorkspaceActivity(UUID workspaceId, UUID cursor, int size);
    List<ActivityLogDto> getEntityActivity(String entityType, UUID entityId);
}
