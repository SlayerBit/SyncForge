package com.syncforge.module.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        AuthUserDto user
) {}
