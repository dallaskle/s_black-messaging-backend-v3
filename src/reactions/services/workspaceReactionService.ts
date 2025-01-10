import supabase from '../../config/supabaseClient';
import AppError from '../../types/AppError';

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