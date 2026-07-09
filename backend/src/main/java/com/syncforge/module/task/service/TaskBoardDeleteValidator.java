package com.syncforge.module.task.service;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.module.board.service.BoardDeleteValidator;
import com.syncforge.module.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskBoardDeleteValidator implements BoardDeleteValidator {

    private final TaskRepository taskRepository;

    @Override
    public void validateDelete(UUID boardId) {
        long count = taskRepository.findByBoardIdAndArchived(boardId, false).size();
        if (count > 0) {
            log.warn("Attempt to delete board {} failed: contains {} active tasks", boardId, count);
            throw new BusinessException("Board cannot be deleted because it contains active tasks.", "BOARD_NOT_EMPTY", HttpStatus.BAD_REQUEST);
        }
    }
}
