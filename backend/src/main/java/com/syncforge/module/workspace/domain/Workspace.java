package com.syncforge.module.workspace.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "workspaces")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Workspace extends BaseEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Version
    private Integer version;

    public Workspace(String name, String slug, String description, User owner) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.owner = owner;
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void transferOwnership(User newOwner) {
        this.owner = newOwner;
    }
}
