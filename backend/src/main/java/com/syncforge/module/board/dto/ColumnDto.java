package com.syncforge.module.board.dto;

import java.time.Instant;
import java.util.UUID;

public record ColumnDto(
        UUID id,
        UUID boardId,
        String name,
        String position,
        Integer taskLimit,
        Instant createdAt,
        Instant updatedAt
) {}
