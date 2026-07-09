package com.syncforge.module.task.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BoardWithTasksDto(
        UUID id,
        UUID workspaceId,
        String name,
        String description,
        String prefix,
        boolean archived,
        int version,
        List<ColumnWithTasksDto> columns,
        Instant createdAt,
        Instant updatedAt
) {}
