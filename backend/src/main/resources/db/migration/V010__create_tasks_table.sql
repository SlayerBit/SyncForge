CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE RESTRICT,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'NONE',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    position VARCHAR(255) NOT NULL,
    identifier VARCHAR(20) NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id),
    due_date DATE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tasks_identifier UNIQUE (board_id, identifier),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE')),
    CONSTRAINT chk_tasks_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'DONE', 'ARCHIVED'))
);

CREATE INDEX idx_tasks_column_position ON tasks (column_id, position) WHERE archived = FALSE;
CREATE INDEX idx_tasks_board ON tasks (board_id, archived);
CREATE INDEX idx_tasks_creator ON tasks (creator_id);
CREATE INDEX idx_tasks_priority ON tasks (board_id, priority);
CREATE INDEX idx_tasks_status ON tasks (board_id, status);
CREATE INDEX idx_tasks_due_date ON tasks (due_date) WHERE due_date IS NOT NULL;
