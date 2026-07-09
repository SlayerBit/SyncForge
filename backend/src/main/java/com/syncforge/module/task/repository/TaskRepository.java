package com.syncforge.module.task.repository;

import com.syncforge.module.task.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    List<Task> findByColumnIdAndArchivedFalseOrderByPositionAsc(UUID columnId);

    List<Task> findByBoardIdAndArchived(UUID boardId, boolean archived);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.column.id = :columnId AND t.archived = false")
    long countActiveTasksByColumnId(@Param("columnId") UUID columnId);

    Optional<Task> findByIdentifier(String identifier);

    @Query(value = "SELECT t.* FROM tasks t JOIN boards b ON t.board_id = b.id " +
            "WHERE b.workspace_id = :workspaceId AND t.search_vector @@ websearch_to_tsquery('english', :query) " +
            "AND t.archived = false", nativeQuery = true)
    List<Task> searchTasksInWorkspace(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
