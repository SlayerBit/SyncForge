package com.syncforge.module.task.service;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.module.board.service.ColumnDeleteValidator;
import com.syncforge.module.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskColumnDeleteValidator implements ColumnDeleteValidator {

    private final TaskRepository taskRepository;

    @Override
    public void validateDelete(UUID columnId) {
        long count = taskRepository.countActiveTasksByColumnId(columnId);
        if (count > 0) {
            log.warn("Attempt to delete column {} failed: contains {} active tasks", columnId, count);
            throw new BusinessException("Column cannot be deleted because it contains active tasks.", "COLUMN_NOT_EMPTY", HttpStatus.BAD_REQUEST);
        }
    }
}
