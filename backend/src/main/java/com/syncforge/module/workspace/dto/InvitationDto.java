package com.syncforge.module.workspace.dto;

import java.time.Instant;
import java.util.UUID;

public record InvitationDto(
        UUID id,
        UUID workspaceId,
        String email,
        String role,
        String status,
        UUID invitedBy,
        Instant expiresAt,
        Instant createdAt
) {}
