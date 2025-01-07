import supabase from '../config/supabaseClient';
import { Message } from '../types/database';
import AppError from '../types/AppError';

export const createMessage = async (
  channelId: string,
  userId: string,
  content: string
): Promise<Message> => {
  // Check if user is a channel member
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

  const { data: message, error } = await supabase
    .from('messages')
    .insert([
      {
        channel_id: channelId,
        user_id: userId,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!message) throw new AppError('Failed to create message', 500);

  return message;
};

export const updateMessage = async (
  messageId: string,
  userId: string,
  content: string
): Promise<Message> => {
  // Check if message exists and belongs to user
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!message) throw new AppError('Message not found', 404);
  if (message.user_id !== userId) throw new AppError('Access denied', 403);

  const { data: updatedMessage, error } = await supabase
    .from('messages')
    .update({ 
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!updatedMessage) throw new AppError('Failed to update message', 500);

  return updatedMessage;
};

export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  // Check if message exists and belongs to user
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!message) throw new AppError('Message not found', 404);
  if (message.user_id !== userId) throw new AppError('Access denied', 403);

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw new AppError(error.message, 400);
};

export const getChannelMessages = async (
  channelId: string,
  userId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> => {
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
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) throw new AppError(error.message, 400);
  return messages || [];
}; 