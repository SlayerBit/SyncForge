CREATE TABLE task_assignments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_task_assignments UNIQUE (task_id, user_id)
);

CREATE INDEX idx_ta_user ON task_assignments (user_id);
