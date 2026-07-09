package com.syncforge.module.auth.repository;

import com.syncforge.module.auth.domain.PasswordResetToken;
import com.syncforge.module.auth.domain.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.status = :status WHERE p.user.id = :userId AND p.status = 'PENDING'")
    void updateStatusForPendingUserTokens(@Param("userId") UUID userId, @Param("status") TokenStatus status);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
