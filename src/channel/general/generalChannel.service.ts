import supabase from '../../config/supabaseClient';
import { Channel } from '../../types/database';
import AppError from '../../types/AppError';

export const createChannel = async (
  workspaceId: string,
  userId: string,
  channelData: Partial<Channel>
): Promise<Channel> => {
  // Check if user is a workspace member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    throw new AppError('Access denied', 403);
  }

  // Create channel
  const { data: channel, error } = await supabase
    .from('channels')
    .insert([
      {
        workspace_id: workspaceId,
        name: channelData.name,
        is_private: channelData.is_private || false,
        type: channelData.type || 'channel',
        topic: channelData.topic,
        description: channelData.description,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!channel) throw new AppError('Failed to create channel', 500);

  // If channel is private, add creator as admin member
  if (channel.is_private) {
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert([
        {
          channel_id: channel.id,
          user_id: userId,
          role: 'admin',
        },
      ]);

    if (memberError) throw new AppError(memberError.message, 400);
  }

  return channel;
};

export const getWorkspaceChannels = async (
  workspaceId: string,
  userId: string
): Promise<Channel[]> => {
  // Check if user is a workspace member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    throw new AppError('Access denied', 403);
  }

  // Get all public channels
  const { data: publicChannels, error: publicError } = await supabase
    .from('channels')
    .select('*, channel_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('is_private', false);

  if (publicError) throw new AppError(publicError.message, 400);

  // Get all private channels where user is a member
  const { data: privateChannels, error: privateError } = await supabase
    .from('channels')
    .select('*, channel_members!inner(*)')
    .eq('workspace_id', workspaceId)
    .eq('is_private', true)
    .eq('channel_members.user_id', userId);

  if (privateError) throw new AppError(privateError.message, 400);

  // Combine public and private channels
  return (publicChannels || []).concat(privateChannels || []);
};

export const getChannelById = async (
  channelId: string,
  userId: string
): Promise<Channel> => {
  // Get channel details
  const { data: channel, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (error || !channel) throw new AppError('Channel not found', 404);

  // Check access for private channels
  if (channel.is_private) {
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership) throw new AppError('Access denied', 403);
  } else {
    // For public channels, verify workspace membership
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', channel.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!workspaceMembership) throw new AppError('Access denied', 403);
  }

  return channel;
};

export const updateChannel = async (
  channelId: string,
  userId: string,
  updates: Partial<Channel>
): Promise<Channel> => {
  // Check if user is channel admin
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (!channel) throw new AppError('Channel not found', 404);

  if (channel.is_private) {
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }
  } else {
    // For public channels, check if user is workspace admin
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', channel.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!workspaceMembership || workspaceMembership.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }
  }

  const { data: updatedChannel, error } = await supabase
    .from('channels')
    .update(updates)
    .eq('id', channelId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!updatedChannel) throw new AppError('Failed to update channel', 500);

  return updatedChannel;
};

export const deleteChannel = async (
  channelId: string,
  userId: string
): Promise<void> => {
  // First get the channel details
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (channelError) throw new AppError(channelError.message, 400);
  if (!channel) throw new AppError('Channel not found', 404);

  // Then check workspace membership and role
  const { data: workspaceMember, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', userId)
    .single();

  if (memberError) throw new AppError(memberError.message, 400);
  if (!workspaceMember) throw new AppError('Not a workspace member', 403);

  // Check if user has permission to delete
  const canDelete = 
    workspaceMember.role === 'admin' || 
    channel.created_by === userId;

  if (!canDelete) {
    throw new AppError('Only workspace admins or channel creators can delete channels', 403);
  }

  // Delete the channel
  const { error: deleteError } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw new AppError(deleteError.message, 400);
  }
}; 