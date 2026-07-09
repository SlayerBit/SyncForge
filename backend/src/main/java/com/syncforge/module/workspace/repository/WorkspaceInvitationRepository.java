package com.syncforge.module.workspace.repository;

import com.syncforge.module.workspace.domain.InvitationStatus;
import com.syncforge.module.workspace.domain.WorkspaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, UUID> {

    Optional<WorkspaceInvitation> findByTokenHash(String tokenHash);

    List<WorkspaceInvitation> findByWorkspaceIdAndStatus(UUID workspaceId, InvitationStatus status);

    Optional<WorkspaceInvitation> findByWorkspaceIdAndEmailAndStatus(UUID workspaceId, String email, InvitationStatus status);

    long countByWorkspaceIdAndStatus(UUID workspaceId, InvitationStatus status);

    @Modifying
    @Query("UPDATE WorkspaceInvitation w SET w.status = 'EXPIRED' WHERE w.status = 'PENDING' AND w.expiresAt < :now")
    int markExpiredInvitations(@Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM WorkspaceInvitation w WHERE w.status = 'EXPIRED' AND w.expiresAt < :threshold")
    int deleteExpiredInvitationsOlderThan30Days(@Param("threshold") Instant threshold);
}
