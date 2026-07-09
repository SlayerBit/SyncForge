package com.syncforge.module.workspace.repository;

import com.syncforge.module.user.domain.User;
import com.syncforge.module.workspace.domain.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    List<WorkspaceMember> findByWorkspaceId(UUID workspaceId);

    List<WorkspaceMember> findByUserId(UUID userId);

    boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    long countByWorkspaceId(UUID workspaceId);

    long countByUserId(UUID userId);

    @Query("SELECT m.user FROM WorkspaceMember m WHERE m.workspace.id = :workspaceId AND (LOWER(m.user.displayName) = LOWER(:name) OR LOWER(m.user.email) = LOWER(:name))")
    Optional<User> findMemberByWorkspaceIdAndNameIgnoreCase(@Param("workspaceId") UUID workspaceId, @Param("name") String name);
}
