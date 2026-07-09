CREATE TABLE workspace_invitations (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_workspace_invitations_role CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
    CONSTRAINT chk_workspace_invitations_status CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'))
);

CREATE INDEX idx_wi_workspace_status ON workspace_invitations (workspace_id, status);
CREATE INDEX idx_wi_email_status ON workspace_invitations (email, status);
CREATE INDEX idx_wi_expires ON workspace_invitations (expires_at);
