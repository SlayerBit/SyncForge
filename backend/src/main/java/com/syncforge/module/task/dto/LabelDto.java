package com.syncforge.module.task.dto;

import java.util.UUID;

public record LabelDto(
        UUID id,
        UUID workspaceId,
        String name,
        String color
) {}
