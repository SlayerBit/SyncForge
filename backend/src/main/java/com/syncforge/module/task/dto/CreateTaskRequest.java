package com.syncforge.module.task.dto;

import com.syncforge.common.validation.ValidEnum;
import com.syncforge.module.task.domain.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank
        @Size(min = 2, max = 255)
        String title,

        @Size(max = 10000)
        String description,

        @ValidEnum(enumClass = Priority.class, ignoreCase = false)
        String priority,

        LocalDate dueDate,

        @Size(max = 5)
        List<UUID> assigneeIds,

        @Size(max = 10)
        List<UUID> labelIds
) {}
