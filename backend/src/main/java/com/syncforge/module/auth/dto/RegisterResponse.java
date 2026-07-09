package com.syncforge.module.auth.dto;

import java.util.UUID;

public record RegisterResponse(
        UUID userId,
        String email,
        String displayName,
        String status,
        String message
) {}
