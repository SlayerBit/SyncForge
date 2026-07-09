package com.syncforge.module.comment.dto;

import com.syncforge.module.user.dto.UserSummaryDto;
import java.time.Instant;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID taskId,
        UserSummaryDto author,
        String content,
        boolean deleted,
        int version,
        Instant createdAt,
        Instant updatedAt
) {}
