package com.syncforge.module.user.dto;

import java.util.UUID;

public record UserSummaryDto(
        UUID id,
        String displayName,
        String avatarUrl
) {}
