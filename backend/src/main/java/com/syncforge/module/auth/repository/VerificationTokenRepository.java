package com.syncforge.module.auth.repository;

import com.syncforge.module.auth.domain.TokenStatus;
import com.syncforge.module.auth.domain.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByTokenHash(String tokenHash);

    Optional<VerificationToken> findByUserIdAndStatus(UUID userId, TokenStatus status);

    @Modifying
    @Query("UPDATE VerificationToken v SET v.status = :status WHERE v.user.id = :userId AND v.status = 'PENDING'")
    void updateStatusForPendingUserTokens(@Param("userId") UUID userId, @Param("status") TokenStatus status);

    @Modifying
    @Query("DELETE FROM VerificationToken v WHERE v.expiresAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
