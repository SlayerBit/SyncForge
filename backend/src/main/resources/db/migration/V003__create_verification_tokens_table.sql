CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verification_tokens_status CHECK (status IN ('PENDING', 'USED', 'EXPIRED'))
);

CREATE INDEX idx_vt_user_status ON verification_tokens (user_id, status);
CREATE INDEX idx_vt_expires ON verification_tokens (expires_at);
