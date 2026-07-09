CREATE TABLE board_columns (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(255) NOT NULL,
    task_limit INTEGER,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bc_task_limit CHECK (task_limit > 0)
);

CREATE INDEX idx_bc_board_position ON board_columns (board_id, position);
