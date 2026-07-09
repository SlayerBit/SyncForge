package com.syncforge.module.auth.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.module.auth.dto.*;
import com.syncforge.module.auth.service.AuthService;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication lifecycle APIs")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user account")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ApiResponse.created(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue tokens")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access and refresh tokens")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ApiResponse.ok(response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Logout from the current session")
    public void logout(HttpServletRequest request, @Valid @RequestBody LogoutRequest logoutRequest) {
        String token = getJwtFromRequest(request);
        String jti = null;
        Instant expiry = null;

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            Claims claims = jwtTokenProvider.getClaims(token);
            jti = claims.getId();
            expiry = claims.getExpiration().toInstant();
        }

        authService.logout(logoutRequest, jti, expiry);
    }

    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Logout from all sessions")
    public void logoutAll(HttpServletRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        String token = getJwtFromRequest(request);
        String jti = null;
        Instant expiry = null;

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            Claims claims = jwtTokenProvider.getClaims(token);
            jti = claims.getId();
            expiry = claims.getExpiration().toInstant();
        }

        authService.logoutAll(principal.getId(), jti, expiry);
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify user email using verification token")
    public ApiResponse<Map<String, String>> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ApiResponse.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification link")
    public ApiResponse<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        authService.resendVerification(body.get("email"));
        return ApiResponse.ok(Map.of("message", "Verification email sent if account exists."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset link")
    public ApiResponse<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.get("email"));
        return ApiResponse.ok(Map.of("message", "Password reset link sent if account exists."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using reset token")
    public ApiResponse<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(Map.of("message", "Password reset successfully."));
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
