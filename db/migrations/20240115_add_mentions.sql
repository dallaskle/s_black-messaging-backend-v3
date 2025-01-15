-- Up Migration
CREATE TYPE mention_type AS ENUM ('GLOBAL', 'WORKSPACE');

-- Add clone_id to users table
ALTER TABLE users
ADD COLUMN clone_id UUID REFERENCES clones(id) DEFAULT NULL;

CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    response_message_id UUID,
    clone_id UUID NOT NULL,
    mention_type mention_type NOT NULL,
    responded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_response_message FOREIGN KEY (response_message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_clone FOREIGN KEY (clone_id) REFERENCES clones(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX idx_mentions_message_id ON mentions(message_id);
CREATE INDEX idx_mentions_clone_id ON mentions(clone_id);
CREATE INDEX idx_mentions_response_message_id ON mentions(response_message_id);
CREATE INDEX idx_users_clone_id ON users(clone_id);

-- Down Migration
DROP INDEX IF EXISTS idx_mentions_message_id;
DROP INDEX IF EXISTS idx_mentions_clone_id;
DROP INDEX IF EXISTS idx_mentions_response_message_id;
DROP INDEX IF EXISTS idx_users_clone_id;

ALTER TABLE users DROP COLUMN IF EXISTS clone_id;

DROP TABLE IF EXISTS mentions;
DROP TYPE IF EXISTS mention_type; 