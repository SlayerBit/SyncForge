package com.syncforge.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component("syncForgeRequestContextFilter")
public class RequestContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String requestId = Optional.ofNullable(req.getHeader("X-Request-ID"))
                .orElse(UUID.randomUUID().toString());
        MDC.put("requestId", requestId);
        MDC.put("correlationId", requestId);
        res.setHeader("X-Request-ID", requestId);

        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}
