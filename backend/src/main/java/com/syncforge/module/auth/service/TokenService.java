package com.syncforge.module.auth.service;

import com.syncforge.module.auth.domain.RefreshToken;
import com.syncforge.module.user.domain.User;

import java.util.UUID;

public interface TokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken rotateRefreshToken(String rawRefreshToken);
    void revokeAllUserTokens(UUID userId);
    void revokeTokenByRawValue(String rawRefreshToken);
}
