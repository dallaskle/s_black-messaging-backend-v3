import supabase from '../../config/supabaseClient';
import { Reaction } from '../../types/database';
import AppError from '../../types/AppError';
import { checkChannelAccess } from './utils/accessControl';

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