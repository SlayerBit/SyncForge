package com.syncforge.module.board.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardDetailDto(
        UUID id,
        UUID workspaceId,
        String name,
        String description,
        String prefix,
        boolean archived,
        int version,
        List<ColumnDto> columns,
        Instant createdAt,
        Instant updatedAt
) {}
