package com.syncforge.module.task.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_assignments", uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskAssignment {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    public TaskAssignment(Task task, User user) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.task = task;
        this.user = user;
        this.assignedAt = Instant.now();
    }
}
