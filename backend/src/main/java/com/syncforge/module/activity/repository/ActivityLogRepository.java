package com.syncforge.module.activity.repository;

import com.syncforge.module.activity.domain.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    @Query("SELECT a FROM ActivityLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<ActivityLog> findByEntity(@Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT a FROM ActivityLog a WHERE a.workspace.id = :workspaceId ORDER BY a.createdAt DESC")
    Slice<ActivityLog> findByWorkspaceFirstPage(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE a.workspace.id = :workspaceId AND a.createdAt < (SELECT a2.createdAt FROM ActivityLog a2 WHERE a2.id = :cursorId) ORDER BY a.createdAt DESC")
    Slice<ActivityLog> findByWorkspaceWithCursor(@Param("workspaceId") UUID workspaceId, @Param("cursorId") UUID cursorId, Pageable pageable);
}
