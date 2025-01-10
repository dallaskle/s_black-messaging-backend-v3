import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';

export const checkChannelAccess = async (channelId: string, userId: string): Promise<void> => {
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