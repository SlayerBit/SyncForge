package com.syncforge.module.comment.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean deleted = false;

    @Version
    private Integer version;

    public Comment(Task task, User author, String content) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.task = task;
        this.author = author;
        this.content = content;
        this.deleted = false;
    }

    public void update(String content) {
        this.content = content;
    }

    public void softDelete() {
        this.deleted = true;
        this.content = "This comment was deleted.";
    }
}
