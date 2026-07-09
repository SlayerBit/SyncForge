package com.syncforge.module.auth.service;

import com.syncforge.module.auth.dto.*;

import java.time.Instant;
import java.util.UUID;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(RefreshTokenRequest request);
    void logout(LogoutRequest request, String accessTokenJti, Instant accessTokenExpiry);
    void logoutAll(UUID userId, String accessTokenJti, Instant accessTokenExpiry);
    void verifyEmail(String token);
    void resendVerification(String email);
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
}
