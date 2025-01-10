import supabase from '../../config/supabaseClient';
import { ChannelMember } from '../../types/database';
import AppError from '../../types/AppError';

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