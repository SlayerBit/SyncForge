package com.syncforge.module.auth.dto;

import java.util.UUID;

public record AuthUserDto(
        UUID id,
        String email,
        String displayName,
        String status,
        String avatarUrl
) {}
