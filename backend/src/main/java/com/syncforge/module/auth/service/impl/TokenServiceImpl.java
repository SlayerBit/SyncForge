package com.syncforge.module.auth.service.impl;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.module.auth.domain.RefreshToken;
import com.syncforge.module.auth.repository.RefreshTokenRepository;
import com.syncforge.module.auth.service.TokenService;
import com.syncforge.module.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenServiceImpl implements TokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private static final SecureRandom secureRandom = new SecureRandom();

    @Value("${syncforge.jwt.refresh-expiry-seconds:604800}")
    private long refreshExpirySeconds;

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest algorithm not available", e);
        }
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        String rawToken = generateSecureToken();
        String hash = hashToken(rawToken);
        String familyId = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofSeconds(refreshExpirySeconds));

        RefreshToken token = new RefreshToken(user, hash, familyId, expiresAt);
        // We will store the raw token transiently/logically so that the auth flow can return the raw value to client
        RefreshToken savedToken = refreshTokenRepository.save(token);
        log.info("Created refresh token for user {} in family {}", user.getId(), familyId);
        
        // Return a custom subclass or attach the raw token value so the service knows what to send
        return new RefreshTokenWithRaw(savedToken, rawToken);
    }

    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token", "INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            log.warn("Attempted to rotate a revoked or expired token: {}", token.getId());
            throw new BusinessException("Refresh token is expired or revoked", "TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED);
        }

        if (token.isUsed()) {
            // Replay attack detected! Revoke all tokens in this family
            log.warn("Replay attack detected for refresh token! Revoking entire family: {}", token.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(token.getFamilyId());
            throw new BusinessException("Replay attack detected. Session terminated.", "TOKEN_REPLAY_DETECTED", HttpStatus.UNAUTHORIZED);
        }

        // Mark current token as used
        token.markUsed();
        refreshTokenRepository.save(token);

        // Generate new token in the same family
        String newRawToken = generateSecureToken();
        String newHash = hashToken(newRawToken);
        Instant expiresAt = Instant.now().plus(Duration.ofSeconds(refreshExpirySeconds));

        RefreshToken newToken = new RefreshToken(token.getUser(), newHash, token.getFamilyId(), expiresAt);
        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);
        log.info("Rotated refresh token for family {}", token.getFamilyId());

        return new RefreshTokenWithRaw(savedNewToken, newRawToken);
    }

    @Override
    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        log.info("Revoking all refresh tokens for user: {}", userId);
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Override
    @Transactional
    public void revokeTokenByRawValue(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
            log.info("Revoked refresh token: {}", token.getId());
        });
    }

    // Custom class to pass raw value back up to caller (AuthService)
    public static class RefreshTokenWithRaw extends RefreshToken {
        private final String rawToken;

        public RefreshTokenWithRaw(RefreshToken token, String rawToken) {
            super(token.getUser(), token.getTokenHash(), token.getFamilyId(), token.getExpiresAt());
            this.rawToken = rawToken;
        }

        public String getRawToken() {
            return rawToken;
        }
    }
}
