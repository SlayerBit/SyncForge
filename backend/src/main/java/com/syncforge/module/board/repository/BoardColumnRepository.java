package com.syncforge.module.board.repository;

import com.syncforge.module.board.domain.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, UUID> {

    List<BoardColumn> findByBoardIdOrderByPositionAsc(UUID boardId);

    long countByBoardId(UUID boardId);
}
