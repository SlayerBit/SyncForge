package com.syncforge.module.activity.dto;

import com.syncforge.module.user.dto.UserSummaryDto;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityLogDto(
        UUID id,
        UUID workspaceId,
        UserSummaryDto actor,
        String entityType,
        UUID entityId,
        String action,
        Map<String, Object> changes,
        Instant createdAt
) {}
