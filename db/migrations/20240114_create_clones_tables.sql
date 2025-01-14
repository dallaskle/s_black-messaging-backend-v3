-- Create enum types
CREATE TYPE clone_visibility AS ENUM ('global', 'private');
CREATE TYPE document_status AS ENUM ('pending', 'processed', 'failed');

-- Create clones table
CREATE TABLE clones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_prompt TEXT NOT NULL,
    visibility clone_visibility NOT NULL DEFAULT 'private',
    workspace_id UUID REFERENCES workspaces(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create clone documents table
CREATE TABLE clone_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clone_id UUID NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    status document_status NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    pinecone_index VARCHAR(255) NOT NULL
);

-- Create AI interactions table
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    clone_id UUID NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id),
    channel_id UUID REFERENCES channels(id),
    query TEXT NOT NULL,
    context JSONB,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_clones_workspace_id ON clones(workspace_id);
CREATE INDEX idx_clones_visibility ON clones(visibility);
CREATE INDEX idx_clone_documents_clone_id ON clone_documents(clone_id);
CREATE INDEX idx_ai_interactions_clone_id ON ai_interactions(clone_id);
CREATE INDEX idx_ai_interactions_workspace_id ON ai_interactions(workspace_id);
CREATE INDEX idx_ai_interactions_channel_id ON ai_interactions(channel_id); 