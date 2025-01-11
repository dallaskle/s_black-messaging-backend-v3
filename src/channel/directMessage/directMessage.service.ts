import supabase from '../../config/supabaseClient';
import AppError from '../../types/AppError';
import { Channel, ChannelMember } from '../../types/database';

export const createDM = async (
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
  const { data: existingChannels, error: channelError } = await supabase
    .from('channels')
    .select('*, channel_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('type', 'dm');

  if (channelError) throw new AppError(channelError.message, 400);

  const existingDM = existingChannels?.find(channel => {
    const members = channel.channel_members;
    return members.length === 2 &&
      members.some((m: ChannelMember) => m.user_id === userId) &&
      members.some((m: ChannelMember) => m.user_id === targetUserId);
  });

  if (existingDM) {
    return existingDM;
  }

  // Get users' names for the channel name
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', [userId, targetUserId]);

  if (usersError) throw new AppError(usersError.message, 400);
  if (!users || users.length !== 2) {
    throw new AppError('One or more users not found', 404);
  }

  const channelName = users.map(u => u.name).sort().join(', ');

  // Create DM channel
  const { data: channel, error: createError } = await supabase
    .from('channels')
    .insert([
      {
        workspace_id: workspaceId,
        name: channelName,
        type: 'dm',
        created_by: userId,
      }
    ])
    .select()
    .single();

  if (createError) throw new AppError(createError.message, 400);
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
      }
    ]);

  if (membersError) throw new AppError(membersError.message, 400);

  // Return channel with members
  const { data: fullChannel, error: fetchError } = await supabase
    .from('channels')
    .select('*, channel_members(*, users(*))')
    .eq('id', channel.id)
    .single();

  if (fetchError) throw new AppError(fetchError.message, 400);
  if (!fullChannel) throw new AppError('Failed to fetch created channel', 500);

  return fullChannel;
};

export const createGroupDM = async (
  workspaceId: string,
  userId: string,
  targetUserIds: string[]
): Promise<Channel> => {
  // Check if all users are workspace members
  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .in('user_id', [userId, ...targetUserIds]);

  if (membershipError) throw new AppError(membershipError.message, 400);
  if (!memberships || memberships.length !== targetUserIds.length + 1) {
    throw new AppError('All users must be workspace members', 403);
  }

  // Get users' names for the channel name
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', [userId, ...targetUserIds]);

  if (usersError) throw new AppError(usersError.message, 400);
  if (!users || users.length !== targetUserIds.length + 1) {
    throw new AppError('One or more users not found', 404);
  }

  const channelName = users.map(u => u.name).sort().join(', ');

  // Create group DM channel
  const { data: channel, error: createError } = await supabase
    .from('channels')
    .insert([
      {
        workspace_id: workspaceId,
        name: channelName,
        type: 'dm',
        created_by: userId,
      }
    ])
    .select()
    .single();

  if (createError) throw new AppError(createError.message, 400);
  if (!channel) throw new AppError('Failed to create group DM channel', 500);

  // Add all users as channel members
  const channelMembers = [userId, ...targetUserIds].map(id => ({
    channel_id: channel.id,
    user_id: id,
    role: 'member',
  }));

  const { error: membersError } = await supabase
    .from('channel_members')
    .insert(channelMembers);

  if (membersError) throw new AppError(membersError.message, 400);

  // Return channel with members
  const { data: fullChannel, error: fetchError } = await supabase
    .from('channels')
    .select('*, channel_members(*, users(*))')
    .eq('id', channel.id)
    .single();

  if (fetchError) throw new AppError(fetchError.message, 400);
  if (!fullChannel) throw new AppError('Failed to fetch created channel', 500);

  return fullChannel;
}; 