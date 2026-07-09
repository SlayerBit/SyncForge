package com.syncforge.module.board.dto;

import java.time.Instant;
import java.util.UUID;

public record BoardDto(
        UUID id,
        UUID workspaceId,
        String name,
        String description,
        String prefix,
        boolean archived,
        int version,
        Instant createdAt,
        Instant updatedAt
) {}
