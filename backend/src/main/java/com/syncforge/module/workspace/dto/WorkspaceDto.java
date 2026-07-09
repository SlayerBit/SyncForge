package com.syncforge.module.workspace.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceDto(
        UUID id,
        String name,
        String slug,
        String description,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt
) {}
