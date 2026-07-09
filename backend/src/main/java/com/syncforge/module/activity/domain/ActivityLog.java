package com.syncforge.module.activity.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.workspace.domain.Workspace;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ActivityLog {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(nullable = false, length = 50)
    private String action;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> changes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ActivityLog(Workspace workspace, User actor, String entityType, UUID entityId, String action, Map<String, Object> changes) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.workspace = workspace;
        this.actor = actor;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.changes = changes;
        this.createdAt = Instant.now();
    }
}
