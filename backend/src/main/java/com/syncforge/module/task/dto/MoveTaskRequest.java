package com.syncforge.module.task.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MoveTaskRequest(
        @NotNull
        UUID targetColumnId,

        UUID afterTaskId,

        @NotNull
        Integer version
) {}
