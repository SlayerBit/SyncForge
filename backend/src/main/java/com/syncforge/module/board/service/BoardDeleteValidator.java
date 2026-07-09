package com.syncforge.module.board.service;

import java.util.UUID;

public interface BoardDeleteValidator {
    void validateDelete(UUID boardId);
}
