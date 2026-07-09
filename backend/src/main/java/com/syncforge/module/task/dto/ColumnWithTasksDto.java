package com.syncforge.module.task.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ColumnWithTasksDto(
        UUID id,
        String name,
        String position,
        Integer taskLimit,
        List<TaskDto> tasks,
        Instant createdAt,
        Instant updatedAt
) {}
