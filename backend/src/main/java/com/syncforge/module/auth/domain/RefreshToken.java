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
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "family_id", nullable = false)
    private String familyId;

    @Column(nullable = false)
    private boolean used;

    @Column(nullable = false)
    private boolean revoked;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RefreshToken(User user, String tokenHash, String familyId, Instant expiresAt) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.user = user;
        this.tokenHash = tokenHash;
        this.familyId = familyId;
        this.used = false;
        this.revoked = false;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public void markUsed() {
        this.used = true;
    }

    public void revoke() {
        this.revoked = true;
    }
}
