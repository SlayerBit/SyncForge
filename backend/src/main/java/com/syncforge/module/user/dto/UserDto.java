package com.syncforge.module.user.dto;

import com.syncforge.module.user.domain.UserPreferences;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String displayName,
        String status,
        String avatarUrl,
        UserPreferences preferences,
        Instant createdAt,
        Instant updatedAt
) {}
