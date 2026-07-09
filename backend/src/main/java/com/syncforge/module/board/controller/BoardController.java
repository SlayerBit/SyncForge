package com.syncforge.module.board.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.module.board.dto.*;
import com.syncforge.module.board.service.BoardService;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Boards", description = "Kanban board and column management APIs")
public class BoardController {

    private final BoardService boardService;
    private final WorkspaceAuthorizationService authService;

    @PostMapping("/workspaces/{workspaceId}/boards")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a board with default columns")
    public ApiResponse<BoardDto> createBoard(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBoardRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.MEMBER);
        BoardDto board = boardService.createBoard(workspaceId, request, principal.getId());
        return ApiResponse.created(board);
    }

    @GetMapping("/workspaces/{workspaceId}/boards")
    @Operation(summary = "List workspace boards")
    public ApiResponse<List<BoardDto>> getWorkspaceBoards(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "includeArchived", defaultValue = "false") boolean includeArchived) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        List<BoardDto> boards = boardService.getWorkspaceBoards(workspaceId, includeArchived);
        return ApiResponse.ok(boards);
    }

    @PatchMapping("/boards/{boardId}")
    @Operation(summary = "Update board details")
    public ApiResponse<BoardDto> updateBoard(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateBoardRequest request) {
        BoardDto board = boardService.getBoard(boardId);
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);
        BoardDto updatedBoard = boardService.updateBoard(boardId, request, principal.getId());
        return ApiResponse.ok(updatedBoard);
    }

    @PostMapping("/boards/{boardId}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Archive a board")
    public void archiveBoard(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal UserPrincipal principal) {
        BoardDto board = boardService.getBoard(boardId);
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.ADMIN);
        boardService.archiveBoard(boardId, principal.getId());
    }

    @PostMapping("/boards/{boardId}/columns")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a new column to the board")
    public ApiResponse<ColumnDto> addColumn(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateColumnRequest request) {
        BoardDto board = boardService.getBoard(boardId);
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);
        ColumnDto column = boardService.addColumn(boardId, request, principal.getId());
        return ApiResponse.created(column);
    }

    @PatchMapping("/columns/{columnId}")
    @Operation(summary = "Update a column details")
    public ApiResponse<ColumnDto> updateColumn(
            @PathVariable UUID columnId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateColumnRequest request) {
        ColumnDto column = boardService.getColumn(columnId);
        BoardDto board = boardService.getBoard(column.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);
        ColumnDto updated = boardService.updateColumn(columnId, request, principal.getId());
        return ApiResponse.ok(updated);
    }

    @DeleteMapping("/columns/{columnId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a column")
    public void deleteColumn(
            @PathVariable UUID columnId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ColumnDto column = boardService.getColumn(columnId);
        BoardDto board = boardService.getBoard(column.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);
        boardService.deleteColumn(columnId, principal.getId());
    }

    @PatchMapping("/columns/{columnId}/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Reorder a column on the board")
    public void reorderColumn(
            @PathVariable UUID columnId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReorderRequest request) {
        ColumnDto column = boardService.getColumn(columnId);
        BoardDto board = boardService.getBoard(column.boardId());
        authService.checkPermission(principal.getId(), board.workspaceId(), WorkspaceRole.MEMBER);
        boardService.reorderColumn(columnId, request, principal.getId());
    }
}
