package com.syncforge.module.auth.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VerificationToken {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TokenStatus status = TokenStatus.PENDING;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public VerificationToken(User user, String tokenHash, Instant expiresAt) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.user = user;
        this.tokenHash = tokenHash;
        this.status = TokenStatus.PENDING;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public void markUsed() {
        this.status = TokenStatus.USED;
    }

    public void markExpired() {
        this.status = TokenStatus.EXPIRED;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
