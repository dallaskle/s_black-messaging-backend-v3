import supabase from '../config/supabaseClient';
import { Channel, ChannelMember } from '../types/database';
import AppError from '../types/AppError';

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

  // Get all public channels and private channels where user is a member
  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(`is_private.eq.false,channel_members.user_id.eq.${userId}`);

  if (error) throw new AppError(error.message, 400);
  return channels || [];
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
  // Similar access check as updateChannel
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

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId);

  if (error) throw new AppError(error.message, 400);
}; 