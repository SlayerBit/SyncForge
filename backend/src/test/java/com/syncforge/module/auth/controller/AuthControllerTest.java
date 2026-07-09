package com.syncforge.module.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncforge.module.auth.dto.LoginRequest;
import com.syncforge.module.auth.dto.LoginResponse;
import com.syncforge.module.auth.dto.RegisterRequest;
import com.syncforge.module.auth.dto.RegisterResponse;
import com.syncforge.module.auth.dto.AuthUserDto;
import com.syncforge.module.auth.service.AuthService;
import com.syncforge.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.data.redis.core.RedisTemplate;
import com.syncforge.security.filter.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @MockBean(name = "syncForgeRequestContextFilter")
    private RequestContextFilter requestContextFilter;

    @MockBean
    private SecurityHeaderFilter securityHeaderFilter;

    @MockBean
    private RequestLoggingFilter requestLoggingFilter;

    @Test
    void shouldRegisterUser_whenValidRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        RegisterRequest request = new RegisterRequest("test@example.com", "StrongP@ss123", "Test User");
        RegisterResponse response = new RegisterResponse(userId, "test@example.com", "Test User", "PENDING", "Registration successful");

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.displayName").value("Test User"));
    }

    @Test
    void shouldLoginUser_whenValidCredentials() throws Exception {
        UUID userId = UUID.randomUUID();
        LoginRequest request = new LoginRequest("test@example.com", "StrongP@ss123");
        AuthUserDto authUser = new AuthUserDto(userId, "test@example.com", "Test User", "ACTIVE", "http://avatar");
        LoginResponse response = new LoginResponse("access-token-123", "refresh-token-123", "Bearer", 900L, authUser);

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-token-123"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token-123"));
    }
}
