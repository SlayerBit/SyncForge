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
@Table(name = "workspace_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkspaceMember {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkspaceRole role;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    public WorkspaceMember(Workspace workspace, User user, WorkspaceRole role) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.workspace = workspace;
        this.user = user;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public void updateRole(WorkspaceRole role) {
        this.role = role;
    }
}
