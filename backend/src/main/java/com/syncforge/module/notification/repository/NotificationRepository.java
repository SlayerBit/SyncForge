package com.syncforge.module.notification.repository;

import com.syncforge.module.notification.domain.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    Slice<Notification> findByUserIdFirstPage(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.createdAt < (SELECT n2.createdAt FROM Notification n2 WHERE n2.id = :cursorId) ORDER BY n.createdAt DESC")
    Slice<Notification> findByUserIdWithCursor(@Param("userId") UUID userId, @Param("cursorId") UUID cursorId, Pageable pageable);

    long countByUserIdAndReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllReadForUser(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :now")
    void deleteExpired(@Param("now") Instant now);
}
