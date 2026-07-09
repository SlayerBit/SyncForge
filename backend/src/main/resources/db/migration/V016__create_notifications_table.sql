CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_read ON notifications (user_id, read, created_at DESC);
CREATE INDEX idx_notif_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notif_cleanup ON notifications (created_at);
