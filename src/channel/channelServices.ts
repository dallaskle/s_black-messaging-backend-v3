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
    .select('*, channel_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('is_private', true)
    .eq('channel_members.user_id', userId);

  if (privateError) throw new AppError(privateError.message, 400);

  // Combine public and private channels
  const channels = (publicChannels || []).concat(privateChannels || []);
  return channels;
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

export const addChannelMember = async (
  channelId: string,
  adminId: string,
  newMemberId: string
): Promise<ChannelMember> => {
  // Get channel details
  const { data: channel } = await supabase
    .from('channels')
    .select('*, workspace_id')
    .eq('id', channelId)
    .single();

  if (!channel) throw new AppError('Channel not found', 404);
  
  // Verify channel is private
  if (!channel.is_private) {
    throw new AppError('Cannot explicitly add members to public channels', 400);
  }

  // Check if admin has permission (must be channel admin)
  const { data: adminMembership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', channelId)
    .eq('user_id', adminId)
    .single();

  if (!adminMembership || adminMembership.role !== 'admin') {
    throw new AppError('Only channel admins can add members', 403);
  }

  // Check if new member is part of the workspace
  const { data: workspaceMembership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', newMemberId)
    .single();

  if (!workspaceMembership) {
    throw new AppError('User must be a workspace member first', 403);
  }

  // Check if user is already a channel member
  const { data: existingMember } = await supabase
    .from('channel_members')
    .select('id')
    .eq('channel_id', channelId)
    .eq('user_id', newMemberId)
    .single();

  if (existingMember) {
    throw new AppError('User is already a channel member', 400);
  }

  // Add user to channel
  const { data: channelMember, error } = await supabase
    .from('channel_members')
    .insert([
      {
        channel_id: channelId,
        user_id: newMemberId,
        role: 'member',
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!channelMember) throw new AppError('Failed to add channel member', 500);

  return channelMember;
};

export const createDMChannel = async (
  workspaceId: string,
  userId: string,
  targetUserId: string
): Promise<Channel> => {
  // Check if both users are workspace members
  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .in('user_id', [userId, targetUserId]);

  if (membershipError) throw new AppError(membershipError.message, 400);
  if (!memberships || memberships.length !== 2) {
    throw new AppError('Both users must be workspace members', 403);
  }

  // Check if DM channel already exists between these users
  const { data: existingChannels } = await supabase
    .from('channels')
    .select('*, channel_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('type', 'dm')
    .eq('is_private', true);

  const existingDM = existingChannels?.find(channel => {
    const members = channel.channel_members;
    return members.length === 2 &&
      members.some((m: ChannelMember) => m.user_id === userId) &&
      members.some((m: ChannelMember) => m.user_id === targetUserId);
  });

  if (existingDM) {
    return existingDM;
  }

  // Get target user's name for the channel name
  const { data: targetUser } = await supabase
    .from('users')
    .select('name')
    .eq('id', targetUserId)
    .single();

  if (!targetUser) throw new AppError('Target user not found', 404);

  // Create DM channel
  const { data: channel, error } = await supabase
    .from('channels')
    .insert([
      {
        workspace_id: workspaceId,
        name: `dm-${userId}-${targetUserId}`, // You might want to use usernames instead
        is_private: true,
        type: 'dm',
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!channel) throw new AppError('Failed to create DM channel', 500);

  // Add both users as channel members
  const { error: membersError } = await supabase
    .from('channel_members')
    .insert([
      {
        channel_id: channel.id,
        user_id: userId,
        role: 'member',
      },
      {
        channel_id: channel.id,
        user_id: targetUserId,
        role: 'member',
      },
    ]);

  if (membersError) throw new AppError(membersError.message, 400);

  return channel;
}; 