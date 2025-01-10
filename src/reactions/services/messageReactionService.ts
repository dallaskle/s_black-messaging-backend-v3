import supabase from '../../config/supabaseClient';
import { Reaction } from '../../types/database';
import AppError from '../../types/AppError';
import { checkChannelAccess } from './utils/accessControl';

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

    if (error && error.code === '23505') {
        console.log('Reaction already exists, removing it');
        await removeReaction(channelId, messageId, userId, emoji);
        return {
            id: 'none',
            message_id: messageId,
            user_id: userId,
            emoji: emoji,
            created_at: new Date(0).toISOString() // This will return a date string equivalent to the Unix epoch (1970-01-01T00:00:00.000Z), which can be considered as a "false" date.
          };
    }
  if (error) {
    throw new AppError(`Failed to add reaction: ${error.message}`, 400);
  }
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