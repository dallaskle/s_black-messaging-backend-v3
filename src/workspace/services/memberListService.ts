import supabase from '../../config/supabaseClient';
import { WorkspaceMember, ChannelMember } from '../../types/database';
import AppError from '../../types/AppError';

export const getWorkspaceMembersList = async (
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember[]> => {
  // First verify the requesting user is a member of the workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    throw new AppError('Access denied', 403);
  }

  // Get all workspace members with their user details
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      users:user_id (
        id,
        name,
        email
      )
    `)
    .eq('workspace_id', workspaceId);

  if (error) throw new AppError(error.message, 400);
  return members || [];
};

export const getChannelMembersList = async (
  channelId: string,
  userId: string
): Promise<ChannelMember[]> => {
  // First get channel details to check privacy
  const { data: channel } = await supabase
    .from('channels')
    .select('*, workspace_id, is_private')
    .eq('id', channelId)
    .single();

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // For private channels, verify membership and get explicit members
  if (channel.is_private) {
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new AppError('Access denied', 403);
    }

    // Get private channel members
    const { data: members, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('channel_id', channelId);

    if (error) throw new AppError(error.message, 400);
    return members || [];
  } else {
    // For public channels, verify workspace membership
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', channel.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!workspaceMembership) {
      throw new AppError('Access denied', 403);
    }

    // For public channels, return all workspace members
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('workspace_id', channel.workspace_id);

    if (error) throw new AppError(error.message, 400);

    // Convert WorkspaceMembers to ChannelMembers format
    return (members || []).map(member => ({
      id: member.id,
      channel_id: channelId,
      user_id: member.user_id,
      role: 'member' as const, // All workspace members are regular members in public channels
      joined_at: member.joined_at,
      users: member.users // Preserve the joined user data
    }));
  }
}; 