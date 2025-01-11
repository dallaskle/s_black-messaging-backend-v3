export type MemberRole = 'admin' | 'member';
export type ChannelRole = 'admin' | 'moderator' | 'member';
export type ChannelType = 'channel' | 'dm';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    workspace_url: string;
    created_at: string;
}

export interface WorkspaceWithChannels extends Workspace {
    channels: Channel[];
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
    invitation_code: string | null;
}

export interface Channel {
    id: string;
    workspace_id: string;
    name: string;
    is_private: boolean;
    type: ChannelType;
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
    parent_message_id: string | null;
    created_at: string;
    updated_at: string | null;
    channels?: {
        workspace_id: string;
    };
    users?: {
        name: string;
    };
    raw_reactions?: Array<{
        emoji: string;
        user_id: string;
    }>;
    files?: File[];
    status: MessageStatus;
}

export enum MessageStatus {
    Deleted = 'deleted',
    Active = 'active',
    Edited = 'edited'
}

export interface File {
    id: string;
    file_id?: string;
    channel_id: string;
    user_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    channels?: {
        workspace_id: string;
        is_private: boolean;
    };
}

export interface ChannelMember {
    id: string;
    channel_id: string;
    user_id: string;
    role: ChannelRole;
    joined_at: string;
}

export interface Reaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface WorkspaceInvitation {
    id: string;
    workspace_id: string;
    email: string;
    token: string;
    role: MemberRole;
    expires_at: string | null;
    single_use: boolean;
    created_by: string;
    created_at: string;
}

export interface MessageFile {
    id: string;
    message_id: string;
    file_id: string;
    created_at: string;
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
    reactions: Reaction;
    workspace_invitations: WorkspaceInvitation;
    message_files: MessageFile;
}

// Enriched message type with processed reactions
export interface EnrichedMessage extends Omit<Message, 'raw_reactions'> {
    name: string;
    reactions: { [emoji: string]: number };
    userReactions: string[];
} 