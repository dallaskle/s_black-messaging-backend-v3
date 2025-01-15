-- Add clone_messages table
CREATE TABLE clone_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL,
    clone_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT fk_channel FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    CONSTRAINT fk_clone FOREIGN KEY (clone_id) REFERENCES clones(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_message FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Add clone_message_files table
CREATE TABLE clone_message_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clone_message_id UUID NOT NULL,
    file_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clone_message FOREIGN KEY (clone_message_id) REFERENCES clone_messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    UNIQUE(clone_message_id, file_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_clone_messages_channel_id ON clone_messages(channel_id);
CREATE INDEX idx_clone_messages_clone_id ON clone_messages(clone_id);
CREATE INDEX idx_clone_messages_parent_id ON clone_messages(parent_message_id);
CREATE INDEX idx_clone_message_files_message_id ON clone_message_files(clone_message_id);
CREATE INDEX idx_clone_message_files_file_id ON clone_message_files(file_id); 