package com.syncforge.module.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateLabelRequest(
        @NotBlank
        @Size(min = 1, max = 50)
        String name,

        @NotBlank
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Must be a valid hex color code (e.g. #EF4444)")
        String color
) {}
