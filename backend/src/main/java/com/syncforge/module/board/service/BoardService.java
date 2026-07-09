package com.syncforge.module.board.service;

import com.syncforge.module.board.dto.*;

import java.util.List;
import java.util.UUID;

public interface BoardService {
    BoardDto createBoard(UUID workspaceId, CreateBoardRequest request, UUID creatorId);
    BoardDto getBoard(UUID boardId);
    ColumnDto getColumn(UUID columnId);
    BoardDetailDto getBoardWithColumns(UUID boardId);
    BoardDto updateBoard(UUID boardId, UpdateBoardRequest request, UUID actorId);
    void archiveBoard(UUID boardId, UUID actorId);
    void deleteBoard(UUID boardId, UUID actorId);
    List<BoardDto> getWorkspaceBoards(UUID workspaceId, boolean includeArchived);

    ColumnDto addColumn(UUID boardId, CreateColumnRequest request, UUID actorId);
    ColumnDto updateColumn(UUID columnId, UpdateColumnRequest request, UUID actorId);
    void deleteColumn(UUID columnId, UUID actorId);
    void reorderColumn(UUID columnId, ReorderRequest request, UUID actorId);
    List<ColumnDto> getBoardColumns(UUID boardId);
}
