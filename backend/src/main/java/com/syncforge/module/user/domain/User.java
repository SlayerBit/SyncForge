package com.syncforge.module.user.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private UserPreferences preferences = new UserPreferences();

    @Version
    private Integer version;

    public User(String email, String passwordHash, String displayName) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.status = UserStatus.PENDING;
        this.preferences = new UserPreferences();
    }

    public void verifyEmail() {
        if (this.status == UserStatus.PENDING) {
            this.status = UserStatus.ACTIVE;
        }
    }

    public void updateProfile(String displayName) {
        this.displayName = displayName;
    }

    public void updatePreferences(UserPreferences preferences) {
        this.preferences = preferences;
    }

    public void updatePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void suspend() {
        this.status = UserStatus.SUSPENDED;
    }

    public void deactivate() {
        this.status = UserStatus.DEACTIVATED;
    }

    public void reactivate() {
        if (this.status == UserStatus.SUSPENDED) {
            this.status = UserStatus.ACTIVE;
        }
    }
}
