CREATE TABLE mentions (
    id UUID PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_mentions UNIQUE (comment_id, mentioned_user_id)
);

CREATE INDEX idx_mentions_user ON mentions (mentioned_user_id);
