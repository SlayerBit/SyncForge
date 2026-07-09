package com.syncforge.module.board.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import com.syncforge.module.workspace.domain.Workspace;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "boards", uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "prefix"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 5)
    private String prefix;

    @Column(name = "task_sequence", nullable = false)
    private int taskSequence = 0;

    @Column(nullable = false)
    private boolean archived = false;

    @Version
    private Integer version;

    public Board(Workspace workspace, String name, String description, String prefix) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.workspace = workspace;
        this.name = name;
        this.description = description;
        this.prefix = prefix;
        this.taskSequence = 0;
        this.archived = false;
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void archive() {
        this.archived = true;
    }

    public void unarchive() {
        this.archived = false;
    }

    public int incrementTaskSequence() {
        this.taskSequence++;
        return this.taskSequence;
    }
}
