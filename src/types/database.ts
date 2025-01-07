export type MemberRole = 'admin' | 'member';
export type ChannelRole = 'admin' | 'moderator' | 'member';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    workspace_url: string;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: MemberRole;
    profile_picture_url: string | null;
    display_name: string | null;
    description: string | null;
    joined_at: string;
}

export interface Channel {
    id: string;
    workspace_id: string;
    name: string;
    is_private: boolean;
    topic: string | null;
    description: string | null;
    created_by: string;
    created_at: string;
}

export interface Message {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string | null;
}

export interface File {
    id: string;
    channel_id: string;
    user_id: string;
    file_url: string;
    uploaded_at: string;
}

export interface ChannelMember {
    id: string;
    channel_id: string;
    user_id: string;
    role: ChannelRole;
    joined_at: string;
}

// Database schema type that includes all tables
export interface Database {
    workspaces: Workspace;
    users: User;
    workspace_members: WorkspaceMember;
    channels: Channel;
    channel_members: ChannelMember;
    messages: Message;
    files: File;
} 