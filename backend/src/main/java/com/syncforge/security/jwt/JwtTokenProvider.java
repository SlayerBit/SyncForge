package com.syncforge.security.jwt;

import com.syncforge.module.user.domain.UserStatus;
import com.syncforge.security.UserPrincipal;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UserPrincipal principal, String jti) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getAccessExpirySeconds() * 1000);

        return Jwts.builder()
                .subject(principal.getId().toString())
                .id(jti)
                .claim("email", principal.getEmail())
                .claim("displayName", principal.getDisplayName())
                .claim("status", principal.getStatus().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS384)
                .compact();
    }

    public UserPrincipal validateAndGetPrincipal(String token) {
        Claims claims = getClaims(token);

        UUID id = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        String displayName = claims.get("displayName", String.class);
        UserStatus status = UserStatus.valueOf(claims.get("status", String.class));

        return new UserPrincipal(id, email, "", displayName, status);
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getJti(String token) {
        return getClaims(token).getId();
    }

    public Date getExpirationDate(String token) {
        return getClaims(token).getExpiration();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
        }
        return false;
    }
}
