package com.syncforge.module.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBoardRequest(
        @NotBlank
        @Size(min = 2, max = 100)
        String name,

        @Size(max = 500)
        String description,

        Integer version
) {}
