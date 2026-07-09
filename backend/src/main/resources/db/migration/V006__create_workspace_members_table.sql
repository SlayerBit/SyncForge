CREATE TABLE workspace_members (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_workspace_members UNIQUE (workspace_id, user_id),
    CONSTRAINT chk_workspace_members_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'))
);

CREATE INDEX idx_wm_user ON workspace_members (user_id);
CREATE INDEX idx_wm_workspace ON workspace_members (workspace_id);
