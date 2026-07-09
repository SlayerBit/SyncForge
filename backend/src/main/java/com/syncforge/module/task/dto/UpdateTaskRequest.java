package com.syncforge.module.task.dto;

import com.syncforge.common.validation.ValidEnum;
import com.syncforge.module.task.domain.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateTaskRequest(
        @NotBlank
        @Size(min = 2, max = 255)
        String title,

        @Size(max = 10000)
        String description,

        @ValidEnum(enumClass = Priority.class, ignoreCase = false)
        String priority,

        LocalDate dueDate,

        @NotNull
        Integer version
) {}
