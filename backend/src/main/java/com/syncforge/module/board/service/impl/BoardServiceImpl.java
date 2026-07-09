package com.syncforge.module.board.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncforge.common.exception.BusinessException;
import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.util.FractionalIndex;
import com.syncforge.module.board.domain.Board;
import com.syncforge.module.board.domain.BoardColumn;
import com.syncforge.module.board.dto.*;
import com.syncforge.module.board.event.*;
import com.syncforge.module.board.mapper.BoardMapper;
import com.syncforge.module.board.repository.BoardColumnRepository;
import com.syncforge.module.board.repository.BoardRepository;
import com.syncforge.module.board.service.BoardService;
import com.syncforge.module.board.service.BoardDeleteValidator;
import com.syncforge.module.board.service.ColumnDeleteValidator;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final WorkspaceRepository workspaceRepository;
    private final BoardMapper boardMapper;
    private final List<ColumnDeleteValidator> deleteValidators;
    private final List<BoardDeleteValidator> boardDeleteValidators;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    private static final String CACHE_KEY_PREFIX = "board:";
    private static final Duration BASE_TTL = Duration.ofMinutes(5);

    private Duration withJitter(Duration baseTtl) {
        long jitterMs = ThreadLocalRandom.current().nextLong(0, baseTtl.toMillis() / 5);
        return baseTtl.plusMillis(jitterMs);
    }

    private void evictCache(UUID boardId) {
        try {
            String key = CACHE_KEY_PREFIX + boardId;
            redisTemplate.delete(key);
            log.debug("Evicted board cache for key: {}", key);
        } catch (Exception e) {
            log.warn("Redis error evicting board cache: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public BoardDto createBoard(UUID workspaceId, CreateBoardRequest request, UUID creatorId) {
        log.info("Creating board {} in workspace {}", request.name(), workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        // Generate a 3-letter uppercase prefix from board name
        String prefix = generatePrefix(request.name(), workspaceId);

        Board board = new Board(workspace, request.name(), request.description(), prefix);
        boardRepository.save(board);

        // Auto create default columns: To Do ('U'), In Progress ('a'), Done ('m')
        BoardColumn todo = new BoardColumn(board, "To Do", "U", null);
        BoardColumn inProgress = new BoardColumn(board, "In Progress", "a", null);
        BoardColumn done = new BoardColumn(board, "Done", "m", null);

        boardColumnRepository.save(todo);
        boardColumnRepository.save(inProgress);
        boardColumnRepository.save(done);

        // Publish events
        eventPublisher.publishEvent(new BoardCreated(board.getId(), workspaceId, board.getName(), creatorId));

        return boardMapper.toDto(board);
    }

    private String generatePrefix(String name, UUID workspaceId) {
        String base = name.replaceAll("[^a-zA-Z]", "").toUpperCase();
        if (base.length() < 3) {
            base = (base + "SFX").substring(0, 3);
        } else {
            base = base.substring(0, 3);
        }

        String candidate = base;
        int count = 1;
        while (boardRepository.existsByWorkspaceIdAndPrefixIgnoreCase(workspaceId, candidate)) {
            candidate = base.substring(0, 2) + count;
            count++;
            if (candidate.length() > 5) {
                candidate = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            }
        }
        return candidate;
    }

    @Override
    @Transactional(readOnly = true)
    public BoardDto getBoard(UUID boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));
        return boardMapper.toDto(board);
    }

    @Override
    @Transactional(readOnly = true)
    public ColumnDto getColumn(UUID columnId) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", columnId));
        return boardMapper.toColumnDto(column);
    }

    @Override
    @Transactional(readOnly = true)
    public BoardDetailDto getBoardWithColumns(UUID boardId) {
        String cacheKey = CACHE_KEY_PREFIX + boardId;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache hit for board detail: {}", boardId);
                return objectMapper.convertValue(cached, BoardDetailDto.class);
            }
        } catch (Exception e) {
            log.warn("Redis error reading board detail cache: {}", e.getMessage());
        }

        log.debug("Cache miss for board detail: {}", boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId);
        BoardDetailDto detailDto = boardMapper.toDetailDto(board, columns);

        try {
            redisTemplate.opsForValue().set(cacheKey, detailDto, withJitter(BASE_TTL));
        } catch (Exception e) {
            log.warn("Redis error writing board detail cache: {}", e.getMessage());
        }

        return detailDto;
    }

    @Override
    @Transactional
    public BoardDto updateBoard(UUID boardId, UpdateBoardRequest request, UUID actorId) {
        log.info("Updating board: {}", boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        board.update(request.name(), request.description());
        boardRepository.save(board);

        evictCache(boardId);

        // Event
        eventPublisher.publishEvent(new BoardUpdated(boardId, board.getWorkspace().getId(), board.getName(), board.getDescription(), actorId));

        return boardMapper.toDto(board);
    }

    @Override
    @Transactional
    public void archiveBoard(UUID boardId, UUID actorId) {
        log.info("Archiving board: {}", boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        board.archive();
        boardRepository.save(board);

        evictCache(boardId);

        // Event
        eventPublisher.publishEvent(new BoardArchived(boardId, board.getWorkspace().getId(), actorId));
    }

    @Override
    @Transactional
    public void deleteBoard(UUID boardId, UUID actorId) {
        log.info("Deleting board: {}", boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Run delete validators
        for (BoardDeleteValidator validator : boardDeleteValidators) {
            validator.validateDelete(boardId);
        }

        boardRepository.delete(board);
        evictCache(boardId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardDto> getWorkspaceBoards(UUID workspaceId, boolean includeArchived) {
        List<Board> boards;
        if (includeArchived) {
            boards = boardRepository.findByWorkspaceId(workspaceId);
        } else {
            boards = boardRepository.findByWorkspaceIdAndArchived(workspaceId, false);
        }
        return boards.stream()
                .map(boardMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ColumnDto addColumn(UUID boardId, CreateColumnRequest request, UUID actorId) {
        log.info("Adding column {} to board {}", request.name(), boardId);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId);
        if (columns.size() >= 12) {
            throw new BusinessException("Maximum limit of 12 columns exceeded", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        String before = columns.isEmpty() ? null : columns.get(columns.size() - 1).getPosition();
        String position = FractionalIndex.midpoint(before, null);

        BoardColumn column = new BoardColumn(board, request.name(), position, request.taskLimit());
        boardColumnRepository.save(column);

        evictCache(boardId);

        // Event
        eventPublisher.publishEvent(new ColumnCreated(column.getId(), boardId, board.getWorkspace().getId(), column.getName(), column.getPosition(), actorId));

        return boardMapper.toColumnDto(column);
    }

    @Override
    @Transactional
    public ColumnDto updateColumn(UUID columnId, UpdateColumnRequest request, UUID actorId) {
        log.info("Updating column: {}", columnId);
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", columnId));

        column.update(request.name(), request.taskLimit());
        boardColumnRepository.save(column);

        evictCache(column.getBoard().getId());

        return boardMapper.toColumnDto(column);
    }

    @Override
    @Transactional
    public void deleteColumn(UUID columnId, UUID actorId) {
        log.info("Deleting column: {}", columnId);
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", columnId));

        // Verify last column constraint
        long columnCount = boardColumnRepository.countByBoardId(column.getBoard().getId());
        if (columnCount <= 1) {
            throw new BusinessException("Cannot delete the last column on a board.", "MIN_COLUMN_LIMIT", HttpStatus.BAD_REQUEST);
        }

        // Call SPI delete validation
        for (ColumnDeleteValidator validator : deleteValidators) {
            validator.validateDelete(columnId);
        }

        boardColumnRepository.delete(column);

        evictCache(column.getBoard().getId());
    }

    @Override
    @Transactional
    public void reorderColumn(UUID columnId, ReorderRequest request, UUID actorId) {
        log.info("Reordering column {} after {}", columnId, request.afterColumnId());
        BoardColumn columnToMove = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", columnId));

        UUID boardId = columnToMove.getBoard().getId();
        List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId);

        String before = null;
        String after = null;

        if (request.afterColumnId() == null) {
            // Move to start
            if (!columns.isEmpty()) {
                after = columns.get(0).getPosition();
            }
        } else {
            // Find index of afterColumn
            int afterIdx = -1;
            for (int i = 0; i < columns.size(); i++) {
                if (columns.get(i).getId().equals(request.afterColumnId())) {
                    afterIdx = i;
                    break;
                }
            }

            if (afterIdx == -1) {
                throw new BusinessException("Target column not found on board.", "NOT_FOUND", HttpStatus.NOT_FOUND);
            }

            before = columns.get(afterIdx).getPosition();
            if (afterIdx + 1 < columns.size()) {
                after = columns.get(afterIdx + 1).getPosition();
            }
        }

        String newPosition = FractionalIndex.midpoint(before, after);
        columnToMove.reorder(newPosition);
        boardColumnRepository.save(columnToMove);

        evictCache(boardId);

        // Event
        eventPublisher.publishEvent(new ColumnReordered(columnId, boardId, columnToMove.getBoard().getWorkspace().getId(), newPosition, actorId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ColumnDto> getBoardColumns(UUID boardId) {
        return boardMapper.toColumnDtoList(boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId));
    }
}
