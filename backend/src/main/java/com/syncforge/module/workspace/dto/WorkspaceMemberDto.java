package com.syncforge.module.workspace.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceMemberDto(
        UUID id,
        UUID userId,
        String displayName,
        String email,
        String avatarUrl,
        String role,
        Instant joinedAt
) {}
