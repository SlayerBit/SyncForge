package com.syncforge.security.filter;

import com.syncforge.module.user.domain.UserStatus;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.jwt.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String jti = tokenProvider.getJti(jwt);
                String blacklistKey = "jwt:blacklist:" + jti;

                Boolean isBlacklisted = false;
                try {
                    isBlacklisted = redisTemplate.hasKey(blacklistKey);
                } catch (Exception e) {
                    log.warn("Redis connection failed during blacklist check: {}", e.getMessage());
                }

                if (Boolean.TRUE.equals(isBlacklisted)) {
                    log.warn("Attempt to use a blacklisted JWT token with JTI: {}", jti);
                } else {
                    UserPrincipal principal = tokenProvider.validateAndGetPrincipal(jwt);

                    if (principal.getStatus() == UserStatus.PENDING) {
                        log.warn("Blocked request from user: {} due to unverified email", principal.getId());
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write(String.format(
                                "{\"status\":403,\"error\":\"EMAIL_UNVERIFIED\",\"message\":\"Please verify your email address.\",\"timestamp\":\"%s\"}",
                                java.time.Instant.now().toString()
                        ));
                        return;
                    } else if (principal.getStatus() == UserStatus.SUSPENDED || principal.getStatus() == UserStatus.DEACTIVATED) {
                        log.warn("Blocked request from user: {} due to status: {}", principal.getId(), principal.getStatus());
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write(String.format(
                                "{\"status\":403,\"error\":\"FORBIDDEN\",\"message\":\"Your account is %s.\",\"timestamp\":\"%s\"}",
                                principal.getStatus().name(),
                                java.time.Instant.now().toString()
                        ));
                        return;
                    } else {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        // Set MDC for logging
                        MDC.put("userId", principal.getId().toString());
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        // Fallback to query parameter (often useful for web sockets or quick testing)
        String paramToken = request.getParameter("token");
        if (StringUtils.hasText(paramToken)) {
            return paramToken;
        }
        return null;
    }
}
