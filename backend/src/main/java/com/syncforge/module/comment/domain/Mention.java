package com.syncforge.module.comment.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentions", uniqueConstraints = @UniqueConstraint(columnNames = {"comment_id", "mentioned_user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Mention {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentioned_user_id", nullable = false)
    private User mentionedUser;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Mention(Comment comment, User mentionedUser) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.comment = comment;
        this.mentionedUser = mentionedUser;
        this.createdAt = Instant.now();
    }
}
