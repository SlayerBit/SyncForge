package com.syncforge.module.board.repository;

import com.syncforge.module.board.domain.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<Board, UUID> {

    List<Board> findByWorkspaceIdAndArchived(UUID workspaceId, boolean archived);

    List<Board> findByWorkspaceId(UUID workspaceId);

    @Query("SELECT COUNT(b) > 0 FROM Board b WHERE b.workspace.id = :workspaceId AND LOWER(b.prefix) = LOWER(:prefix)")
    boolean existsByWorkspaceIdAndPrefixIgnoreCase(@Param("workspaceId") UUID workspaceId, @Param("prefix") String prefix);
}
