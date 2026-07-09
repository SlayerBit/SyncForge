package com.syncforge.module.workspace.repository;

import com.syncforge.module.workspace.domain.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    Optional<Workspace> findBySlug(String slug);

    boolean existsBySlug(String slug);

    long countByOwnerId(UUID ownerId);
}
