package com.syncforge.module.board.dto;

import java.util.UUID;

public record ReorderRequest(
        UUID afterColumnId
) {}
