package com.syncforge.module.board.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateColumnRequest(
        @NotBlank
        @Size(min = 1, max = 100)
        String name,

        @Min(1)
        Integer taskLimit
) {}
