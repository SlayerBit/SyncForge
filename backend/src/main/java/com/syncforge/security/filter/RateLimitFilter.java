package com.syncforge.security.filter;

import com.syncforge.security.RateLimiter;
import com.syncforge.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiter rateLimiter;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIp(request);
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 1. Unauthenticated endpoints IP limits
        if ("POST".equalsIgnoreCase(method)) {
            if ("/api/auth/register".equals(uri)) {
                if (!rateLimiter.isAllowed("register:ip:" + ip, 3, Duration.ofMinutes(10))) {
                    sendRateLimitError(response, "Too many registration attempts from this IP. Please try again in 10 minutes.");
                    return;
                }
            } else if ("/api/auth/login".equals(uri)) {
                if (!rateLimiter.isAllowed("login:ip:" + ip, 20, Duration.ofMinutes(1))) {
                    sendRateLimitError(response, "Too many login attempts from this IP. Please try again in 1 minute.");
                    return;
                }
            }
        }

        // 2. General API limits
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAllowed = true;
        int limit = 200;
        String limitKey;

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
            limit = 100;
            limitKey = "api:" + principal.getId();
            // Refresh token endpoint custom limit
            if ("/api/auth/refresh".equals(uri) && "POST".equalsIgnoreCase(method)) {
                isAllowed = rateLimiter.isAllowed("refresh:" + principal.getId(), 10, Duration.ofMinutes(1));
                limit = 10;
            } else {
                isAllowed = rateLimiter.isAllowed(limitKey, 100, Duration.ofMinutes(1));
            }
        } else {
            limitKey = "api:ip:" + ip;
            // Ignore auth endpoints themselves from the general unauthenticated API rate limiting if needed,
            // but the requirement says: "General API (per IP): 200/min"
            isAllowed = rateLimiter.isAllowed(limitKey, 200, Duration.ofMinutes(1));
        }

        if (!isAllowed) {
            sendRateLimitError(response, "Rate limit exceeded. Please try again later.");
            return;
        }

        // Add headers (approximate headers, simple version)
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        // Reset window end timestamp (approximate)
        response.setHeader("X-RateLimit-Reset", String.valueOf(Instant.now().getEpochSecond() + 60));

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private void sendRateLimitError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"status\":429,\"error\":\"RATE_LIMITED\",\"message\":\"%s\",\"timestamp\":\"%s\"}",
                message, Instant.now().toString()
        ));
    }
}
