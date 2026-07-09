package com.syncforge.module.task.repository;

import com.syncforge.module.task.domain.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabelRepository extends JpaRepository<Label, UUID> {

    List<Label> findByWorkspaceId(UUID workspaceId);

    @Query("SELECT COUNT(l) > 0 FROM Label l WHERE l.workspace.id = :workspaceId AND LOWER(l.name) = LOWER(:name)")
    boolean existsByWorkspaceIdAndNameIgnoreCase(@Param("workspaceId") UUID workspaceId, @Param("name") String name);

    long countByWorkspaceId(UUID workspaceId);
}
