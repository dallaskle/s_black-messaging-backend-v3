import supabase from '../../config/supabaseClient';
import { Message, EnrichedMessage } from '../../types/database';

export const enrichMessageWithDetails = async (
  message: Message,
  userId: string
): Promise<EnrichedMessage> => {
  // Get workspace member info
  const { data: workspaceMember } = await supabase
    .from('workspace_members')
    .select('display_name')
    .eq('workspace_id', message.channels?.workspace_id)
    .eq('user_id', message.user_id)
    .single();

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', message.user_id)
    .single();

  // Get reactions
  const { data: reactions } = await supabase
    .from('reactions')
    .select('emoji, user_id')
    .eq('message_id', message.id);

  // Process reactions
  const reactionCounts: { [emoji: string]: number } = {};
  const userReactions: string[] = [];
  
  reactions?.forEach(reaction => {
    reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
    if (reaction.user_id === userId) {
      userReactions.push(reaction.emoji);
    }
  });

  return {
    ...message,
    name: workspaceMember?.display_name || user?.name || 'Unknown',
    reactions: reactionCounts,
    userReactions
  };
};
