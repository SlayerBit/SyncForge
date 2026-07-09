package com.syncforge.module.task.dto;

import com.syncforge.module.user.dto.UserSummaryDto;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskDto(
        UUID id,
        UUID columnId,
        UUID boardId,
        String identifier,
        String title,
        String description,
        String priority,
        String status,
        String position,
        LocalDate dueDate,
        boolean archived,
        int version,
        List<UserSummaryDto> assignees,
        List<LabelDto> labels,
        int commentCount,
        Instant createdAt,
        Instant updatedAt
) {}
