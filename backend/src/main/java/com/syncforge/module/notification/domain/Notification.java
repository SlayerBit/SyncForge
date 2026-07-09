package com.syncforge.module.notification.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Notification(User user, NotificationType type, String title, String message, String referenceType, UUID referenceId) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.read = false;
        this.createdAt = Instant.now();
    }

    public void markRead() {
        this.read = true;
    }
}
