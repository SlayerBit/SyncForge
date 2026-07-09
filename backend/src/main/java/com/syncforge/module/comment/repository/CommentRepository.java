package com.syncforge.module.comment.repository;

import com.syncforge.module.comment.domain.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId ORDER BY c.createdAt DESC")
    List<Comment> findByTaskIdOrderByCreatedAtDesc(@Param("taskId") UUID taskId);

    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId AND c.createdAt < (SELECT c2.createdAt FROM Comment c2 WHERE c2.id = :cursorId) ORDER BY c.createdAt DESC")
    Slice<Comment> findByTaskIdWithCursor(@Param("taskId") UUID taskId, @Param("cursorId") UUID cursorId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId ORDER BY c.createdAt DESC")
    Slice<Comment> findByTaskIdFirstPage(@Param("taskId") UUID taskId, Pageable pageable);

    @Query("SELECT c.task.id, COUNT(c) FROM Comment c WHERE c.task.id IN :taskIds AND c.deleted = false GROUP BY c.task.id")
    List<Object[]> countNonDeletedCommentsForTasks(@Param("taskIds") Collection<UUID> taskIds);

    long countByTaskIdAndDeletedFalse(UUID taskId);

    @Query(value = "SELECT c.* FROM comments c JOIN tasks t ON c.task_id = t.id JOIN boards b ON t.board_id = b.id " +
            "WHERE b.workspace_id = :workspaceId AND c.search_vector @@ websearch_to_tsquery('english', :query) " +
            "AND c.deleted = false", nativeQuery = true)
    List<Comment> searchCommentsInWorkspace(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
