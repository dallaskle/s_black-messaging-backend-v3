import supabase from '../config/supabaseClient';
import { Reaction } from '../types/database';
import AppError from '../types/AppError';

const checkChannelAccess = async (channelId: string, userId: string): Promise<void> => {
  const { data: membership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', channelId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    const { data: channel } = await supabase
      .from('channels')
      .select('workspace_id, is_private')
      .eq('id', channelId)
      .single();

    if (!channel) throw new AppError('Channel not found', 404);

    if (channel.is_private) {
      throw new AppError('Access denied', 403);
    }

    const { data: workspaceMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', channel.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!workspaceMember) throw new AppError('Access denied', 403);
  }
};

export const addReaction = async (
  channelId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<Reaction> => {
  await checkChannelAccess(channelId, userId);

  const { data: reaction, error } = await supabase
    .from('reactions')
    .insert([
      {
        message_id: messageId,
        user_id: userId,
        emoji
      }
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!reaction) throw new AppError('Failed to create reaction', 500);

  return reaction;
};

export const removeReaction = async (
  channelId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  await checkChannelAccess(channelId, userId);

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw new AppError(error.message, 400);
};

export const getMessageReactions = async (
  channelId: string,
  messageId: string,
  userId: string
): Promise<Reaction[]> => {
  await checkChannelAccess(channelId, userId);

  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('*, users!inner(name)')
    .eq('message_id', messageId);

  if (error) throw new AppError(error.message, 400);
  return reactions || [];
};

export const getReactionCounts = async (
  channelId: string,
  messageId: string,
  userId: string
): Promise<Record<string, number>> => {
  await checkChannelAccess(channelId, userId);

  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('message_id', messageId);

  if (error) throw new AppError(error.message, 400);

  const counts: Record<string, number> = {};
  reactions?.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });

  return counts;
};

export const getChannelReactions = async (
  channelId: string,
  userId: string
): Promise<Reaction[]> => {
  await checkChannelAccess(channelId, userId);

  const { data: reactions, error } = await supabase
    .from('reactions')
    .select(`
      *,
      messages!inner(channel_id),
      users!inner(name)
    `)
    .eq('messages.channel_id', channelId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError(error.message, 400);
  return reactions || [];
};

export const getPopularWorkspaceReactions = async (
  workspaceId: string,
  userId: string
): Promise<{ emoji: string; count: number }[]> => {
  // Check workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership) throw new AppError('Access denied', 403);

  const { data: reactions, error } = await supabase
    .from('reactions')
    .select(`
      emoji,
      messages!inner(
        channel_id,
        channels!inner(
          workspace_id
        )
      )
    `)
    .eq('messages.channels.workspace_id', workspaceId);

  if (error) throw new AppError(error.message, 400);

  const counts: Record<string, number> = {};
  reactions?.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
}; 