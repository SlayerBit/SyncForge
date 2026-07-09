package com.syncforge.module.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank
        @Size(max = 5000)
        String content
) {}
