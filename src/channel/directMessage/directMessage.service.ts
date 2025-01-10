import supabase from '../../config/supabaseClient';
import { Channel, ChannelMember } from '../../types/database';
import AppError from '../../types/AppError';

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
        name: `dm-${userId}-${targetUserId}`,
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