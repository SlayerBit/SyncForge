package com.syncforge.module.auth.service.impl;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.common.util.GravatarUtils;
import com.syncforge.module.auth.domain.PasswordResetToken;
import com.syncforge.module.auth.domain.RefreshToken;
import com.syncforge.module.auth.domain.TokenStatus;
import com.syncforge.module.auth.domain.VerificationToken;
import com.syncforge.module.auth.dto.*;
import com.syncforge.module.auth.event.EmailVerified;
import com.syncforge.module.auth.event.PasswordResetCompleted;
import com.syncforge.module.auth.event.UserRegistered;
import com.syncforge.module.auth.repository.PasswordResetTokenRepository;
import com.syncforge.module.auth.repository.VerificationTokenRepository;
import com.syncforge.module.auth.service.AuthService;
import com.syncforge.module.auth.service.EmailService;
import com.syncforge.module.auth.service.TokenService;
import com.syncforge.module.auth.validator.PasswordStrengthValidator;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.domain.UserStatus;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.jwt.JwtProperties;
import com.syncforge.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final com.syncforge.common.metrics.SyncForgeMetrics metrics;

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PasswordStrengthValidator passwordStrengthValidator;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    private static final SecureRandom secureRandom = new SecureRandom();

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
    public RegisterResponse register(RegisterRequest request) {
        log.info("Processing registration request for: {}", request.email());

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException("An account with this email already exists.", "EMAIL_ALREADY_EXISTS", HttpStatus.CONFLICT);
        }

        List<String> pwdErrors = passwordStrengthValidator.validate(request.password());
        if (!pwdErrors.isEmpty()) {
            throw new BusinessException("Password strength requirements not met: " + String.join(", ", pwdErrors), "WEAK_PASSWORD", HttpStatus.BAD_REQUEST);
        }

        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.displayName());
        userRepository.save(user);

        // Verification token
        String rawToken = generateSecureToken();
        String hash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(Duration.ofHours(24));
        VerificationToken verificationToken = new VerificationToken(user, hash, expiresAt);
        verificationTokenRepository.save(verificationToken);

        // Send email
        emailService.sendVerificationEmail(user.getEmail(), rawToken);

        // Publish event
        eventPublisher.publishEvent(new UserRegistered(user.getId(), user.getEmail(), user.getDisplayName()));

        return new RegisterResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStatus().name(),
                "Please check your email to verify your account."
        );
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        String lockoutKey = "login:lockout:" + email;
        String failedCounterKey = "login:failed:" + email;

        // Check lockout
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockoutKey))) {
            log.warn("Login attempt blocked due to lockout: {}", email);
            throw new BusinessException("Account temporarily locked. Try again later or reset your password.", "ACCOUNT_LOCKED", HttpStatus.LOCKED);
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        // Standard dummy BCrypt check to prevent timing attacks
        boolean matches = false;
        if (user != null) {
            matches = passwordEncoder.matches(request.password(), user.getPasswordHash());
        } else {
            passwordEncoder.matches(request.password(), "$2a$12$DummyBCryptHashForTimingAttackPrevention");
        }

        if (!matches) {
            Long failedAttempts = redisTemplate.opsForValue().increment(failedCounterKey);
            if (failedAttempts != null && failedAttempts == 1) {
                redisTemplate.expire(failedCounterKey, Duration.ofMinutes(30));
            }

            if (failedAttempts != null && failedAttempts >= 10) {
                 redisTemplate.opsForValue().set(lockoutKey, "", Duration.ofMinutes(15));
                 redisTemplate.delete(failedCounterKey);
                 metrics.incrementLoginLockout();
                 log.warn("Account locked due to consecutive failures: {}", email);
                 throw new BusinessException("Account temporarily locked. Try again later or reset your password.", "ACCOUNT_LOCKED", HttpStatus.LOCKED);
            }

            throw new BusinessException("Invalid credentials", "UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
        }

        // Clear failed logs on success
        redisTemplate.delete(failedCounterKey);

        if (user.getStatus() == UserStatus.PENDING) {
            throw new BusinessException("Please verify your email address before logging in.", "EMAIL_UNVERIFIED", HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BusinessException("Your account is " + user.getStatus().name(), "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        // Generate tokens
        UserPrincipal principal = UserPrincipal.create(user);
        String jti = UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(principal, jti);

        TokenServiceImpl.RefreshTokenWithRaw refreshTokenWithRaw = (TokenServiceImpl.RefreshTokenWithRaw) tokenService.createRefreshToken(user);

        return new LoginResponse(
                accessToken,
                refreshTokenWithRaw.getRawToken(),
                "Bearer",
                jwtProperties.getAccessExpirySeconds(),
                new AuthUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getStatus().name(), GravatarUtils.getAvatarUrl(user.getEmail()))
        );
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        TokenServiceImpl.RefreshTokenWithRaw newRefreshTokenWithRaw = (TokenServiceImpl.RefreshTokenWithRaw) tokenService.rotateRefreshToken(request.refreshToken());
        User user = newRefreshTokenWithRaw.getUser();

        UserPrincipal principal = UserPrincipal.create(user);
        String jti = UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(principal, jti);

        return new LoginResponse(
                accessToken,
                newRefreshTokenWithRaw.getRawToken(),
                "Bearer",
                jwtProperties.getAccessExpirySeconds(),
                new AuthUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getStatus().name(), GravatarUtils.getAvatarUrl(user.getEmail()))
        );
    }

    @Override
    @Transactional
    public void logout(LogoutRequest request, String accessTokenJti, Instant accessTokenExpiry) {
        log.info("Blacklisting JTI and revoking refresh token");

        // 1. Blacklist current access token in Redis
        if (accessTokenJti != null && accessTokenExpiry != null) {
            Duration remaining = Duration.between(Instant.now(), accessTokenExpiry);
            if (remaining.isPositive()) {
                redisTemplate.opsForValue().set("jwt:blacklist:" + accessTokenJti, "", remaining);
            }
        }

        // 2. Revoke the refresh token
        tokenService.revokeTokenByRawValue(request.refreshToken());
    }

    @Override
    @Transactional
    public void logoutAll(UUID userId, String accessTokenJti, Instant accessTokenExpiry) {
        log.info("Blacklisting JTI and revoking all refresh tokens for user: {}", userId);

        // 1. Blacklist current access token in Redis
        if (accessTokenJti != null && accessTokenExpiry != null) {
            Duration remaining = Duration.between(Instant.now(), accessTokenExpiry);
            if (remaining.isPositive()) {
                redisTemplate.opsForValue().set("jwt:blacklist:" + accessTokenJti, "", remaining);
            }
        }

        // 2. Revoke all refresh tokens for the user
        tokenService.revokeAllUserTokens(userId);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        String hash = hashToken(token);
        VerificationToken verificationToken = verificationTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BusinessException("Invalid verification token", "INVALID_TOKEN", HttpStatus.BAD_REQUEST));

        if (verificationToken.getStatus() != TokenStatus.PENDING || verificationToken.isExpired()) {
            throw new BusinessException("Verification link expired or already used.", "TOKEN_EXPIRED", HttpStatus.BAD_REQUEST);
        }

        verificationToken.markUsed();
        verificationTokenRepository.save(verificationToken);

        User user = verificationToken.getUser();
        user.verifyEmail();
        userRepository.save(user);

        // Invalidate cache
        redisTemplate.delete("user:" + user.getId());

        // Publish event
        eventPublisher.publishEvent(new EmailVerified(user.getId(), user.getEmail()));
    }

    @Override
    @Transactional
    public void resendVerification(String email) {
        log.info("Resending verification for email: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null && user.getStatus() == UserStatus.PENDING) {
            Optional<VerificationToken> existingTokenOpt = verificationTokenRepository.findByUserIdAndStatus(user.getId(), TokenStatus.PENDING);
            if (existingTokenOpt.isPresent()) {
                VerificationToken existingToken = existingTokenOpt.get();
                Duration elapsed = Duration.between(existingToken.getCreatedAt(), Instant.now());
                if (elapsed.getSeconds() < 60) {
                    long waitSecs = 60 - elapsed.getSeconds();
                    throw new BusinessException(
                            "Please wait " + waitSecs + " seconds before requesting a new verification email.",
                            "COOLDOWN_ACTIVE",
                            HttpStatus.TOO_MANY_REQUESTS
                    );
                }
            }

            verificationTokenRepository.updateStatusForPendingUserTokens(user.getId(), TokenStatus.EXPIRED);

            String rawToken = generateSecureToken();
            String hash = hashToken(rawToken);
            Instant expiresAt = Instant.now().plus(Duration.ofHours(24));
            VerificationToken verificationToken = new VerificationToken(user, hash, expiresAt);
            verificationTokenRepository.save(verificationToken);

            emailService.sendVerificationEmail(user.getEmail(), rawToken);
        }
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        log.info("Forgot password request for email: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null) {
            passwordResetTokenRepository.updateStatusForPendingUserTokens(user.getId(), TokenStatus.EXPIRED);

            String rawToken = generateSecureToken();
            String hash = hashToken(rawToken);
            Instant expiresAt = Instant.now().plus(Duration.ofHours(1));
            PasswordResetToken resetToken = new PasswordResetToken(user, hash, expiresAt);
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = hashToken(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BusinessException("Invalid reset token", "INVALID_TOKEN", HttpStatus.BAD_REQUEST));

        if (resetToken.getStatus() != TokenStatus.PENDING || resetToken.isExpired()) {
            throw new BusinessException("Password reset link expired or already used.", "TOKEN_EXPIRED", HttpStatus.BAD_REQUEST);
        }

        List<String> pwdErrors = passwordStrengthValidator.validate(request.newPassword());
        if (!pwdErrors.isEmpty()) {
            throw new BusinessException("Password strength requirements not met: " + String.join(", ", pwdErrors), "WEAK_PASSWORD", HttpStatus.BAD_REQUEST);
        }

        User user = resetToken.getUser();
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.markUsed();
        passwordResetTokenRepository.save(resetToken);

        // Revoke all refresh tokens
        tokenService.revokeAllUserTokens(user.getId());

        // Publish event
        eventPublisher.publishEvent(new PasswordResetCompleted(user.getId()));
    }

    @org.springframework.context.event.EventListener
    @org.springframework.transaction.annotation.Transactional
    public void handleUserDeactivated(com.syncforge.module.user.event.UserDeactivated event) {
        log.info("Handling UserDeactivated event for user: {}", event.userId());
        tokenService.revokeAllUserTokens(event.userId());
    }
}
