CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_al_entity ON activity_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_al_workspace ON activity_logs (workspace_id, created_at DESC);
CREATE INDEX idx_al_actor ON activity_logs (actor_id);
