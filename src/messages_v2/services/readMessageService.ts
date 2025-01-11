import supabase from '../../config/supabaseClient';
import { EnrichedMessage } from '../../types/database';
import AppError from '../../types/AppError';
import { getSignedUrl } from '../utils/fileUrlSigner';
import { enrichMessageWithDetails } from '../utils/messageEnricher';

export const getChannelMessages = async (
  channelId: string,
  userId: string,
  limit: number = 50,
  before?: string
): Promise<EnrichedMessage[]> => {
  // Check channel access
  const { data: membership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', channelId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    // For public channels, check workspace membership
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

  let query = supabase
    .from('messages')
    .select(`
      *,
      channels!inner (
        workspace_id
      ),
      users!inner (
        name
      ),
      files:message_files (
        file:files (
          id,
          file_url,
          file_name,
          file_size,
          mime_type,
          thumbnail_url
        )
      )
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) throw new AppError(error.message, 400);

  // Transform the data to include user name and process reactions
  const transformedMessages = await Promise.all(messages.map(async (msg) => {
    // Process files and get signed URLs
    const files = await Promise.all(
      (msg.files || [])
        .filter((f: any) => f.file)
        .map(async (fileRel: any) => {
          const file = fileRel.file;
          const signedUrl = await getSignedUrl(file);
          return {
            ...file,
            file_url: signedUrl
          };
        })
    );

    return {
      ...msg,
      name: msg.users.name,
      reactions: {},
      userReactions: [],
      files
    };
  }));

  return transformedMessages;
};

export const getThreadMessages = async (
  messageId: string,
  userId: string,
  limit: number = 50,
  before?: string
): Promise<(EnrichedMessage & { name: string })[]> => {
  // First get the parent message to check access
  const { data: parentMessage } = await supabase
    .from('messages')
    .select('channel_id')
    .eq('id', messageId)
    .single();

  if (!parentMessage) throw new AppError('Message not found', 404);

  // Check channel access
  const { data: membership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', parentMessage.channel_id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    // For public channels, check workspace membership
    const { data: channel } = await supabase
      .from('channels')
      .select('workspace_id, is_private')
      .eq('id', parentMessage.channel_id)
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

  let query = supabase
    .from('messages')
    .select(`
      *,
      channels!inner (
        workspace_id
      ),
      users!inner (
        name
      )
    `)
    .eq('parent_message_id', messageId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) throw new AppError(error.message, 400);

  if (messages && messages.length > 0) {
    const { data: workspaceMembers } = await supabase
      .from('workspace_members')
      .select('user_id, display_name')
      .eq('workspace_id', messages[0].channels.workspace_id);

    const transformedMessages = messages.map(msg => {
      const workspaceMember = workspaceMembers?.find(wm => wm.user_id === msg.user_id);
      
      return {
        id: msg.id,
        channel_id: msg.channel_id,
        user_id: msg.user_id,
        content: msg.content,
        parent_message_id: msg.parent_message_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        channels: msg.channels,
        users: msg.users,
        name: workspaceMember?.display_name || msg.users.name,
        reactions: {},
        userReactions: [],
        status: msg.status
      };
    }) as EnrichedMessage[];

    return transformedMessages;
  }

  return [];
};
