package com.syncforge.module.workspace.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkspaceInvitation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkspaceRole role;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvitationStatus status = InvitationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WorkspaceInvitation(Workspace workspace, String email, WorkspaceRole role, String tokenHash, User invitedBy, Instant expiresAt) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.workspace = workspace;
        this.email = email.toLowerCase().trim();
        this.role = role;
        this.tokenHash = tokenHash;
        this.status = InvitationStatus.PENDING;
        this.invitedBy = invitedBy;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }

    public void revoke() {
        this.status = InvitationStatus.REVOKED;
    }

    public void expire() {
        this.status = InvitationStatus.EXPIRED;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
