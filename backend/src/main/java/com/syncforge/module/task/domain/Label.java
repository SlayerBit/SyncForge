package com.syncforge.module.task.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.workspace.domain.Workspace;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "labels", uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "name"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Label {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Label(Workspace workspace, String name, String color) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.workspace = workspace;
        this.name = name;
        this.color = color;
        this.createdAt = Instant.now();
    }

    public void update(String name, String color) {
        this.name = name;
        this.color = color;
    }
}
