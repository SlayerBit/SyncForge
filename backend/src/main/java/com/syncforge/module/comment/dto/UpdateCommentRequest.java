package com.syncforge.module.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(
        @NotBlank
        @Size(max = 5000)
        String content,

        @NotNull
        Integer version
) {}
