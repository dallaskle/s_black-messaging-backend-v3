import supabase, { serviceClient } from '../config/supabaseClient';
import { Message, EnrichedMessage } from '../types/database';
import AppError from '../types/AppError';
import { fileService } from './fileService';
import { compareSync } from 'bcryptjs';

interface RawReaction {
  emoji: string;
  user_id: string;
}

const STORAGE_BUCKET = process.env.SUPABASE_FILE_STORAGE_TABLE || 's-black-messaging-files';

// Add helper function to get signed URL
const getSignedUrl = async (file: any) => {
  console.log('[File URL Signing] Initiating for file:', { fileId: file.id, fileUrl: file.file_url });
  try {
    // Extract just the file path without the storage/v1/object/public part
    const fileUrl = new URL(file.file_url);
    const pathParts = fileUrl.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public') + 1;
    const filePath = pathParts.slice(bucketIndex).join('/');
    
    console.log('[File URL Signing] Extracted file path:', { filePath });

    const { data, error } = await serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('[File URL Signing] Failed to create signed URL:', { 
        fileId: file.id, 
        error,
        filePath 
      });
      return file.file_url;  // Fall back to public URL if signing fails
    }

    console.log('[File URL Signing] Successfully created signed URL');
    return data.signedUrl;
  } catch (error) {
    console.error('[File URL Signing] Error occurred:', { 
      fileId: file.id, 
      error: error instanceof Error ? error.message : error 
    });
    return file.file_url;  // Fall back to public URL if error occurs
  }
};

const enrichMessageWithDetails = async (
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

export const createMessage = async (
  channelId: string,
  userId: string,
  content: string,
  parentMessageId?: string,
  fileIds?: string[]
) => {
  const logContext = {
    channelId,
    userId,
    parentMessageId,
    fileIds,
    messageLength: content.length
  };

  try {
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
        parent_message_id: parentMessageId,
      })
      .select()
      .single();

    if (insertError) {
      throw new AppError(insertError.message, 500);
    }

    if (fileIds && fileIds.length > 0) {
      await fileService.linkFilesToMessage(insertedMessage.id, fileIds);
    }

    // 3. Fetch the newly created message with related data
    const { data: fullMessage, error: fetchError } = await supabase
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
      .eq('id', insertedMessage.id)
      .single();

    if (fetchError) {
      throw new AppError(fetchError.message, 500);
    }

    // 4. Process files array
    const newFiles = fullMessage.files?.map((rel: any) => rel.file) || [];
    
    // 5. Enrich with additional data
    const enriched = await enrichMessageWithDetails(fullMessage, userId);
    
    const finalMessage = {
      ...enriched,
      files: newFiles
    };

    return finalMessage;

  } catch (error) {
    throw error;
  }
};

export const updateMessage = async (
  messageId: string,
  userId: string,
  content: string
): Promise<EnrichedMessage> => {
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
    .select(`
      *,
      channels!inner (
        workspace_id
      )
    `)
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!updatedMessage) throw new AppError('Failed to update message', 500);

  return enrichMessageWithDetails(updatedMessage, userId);
};

export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  // Check if message exists and belongs to user
  const { data: message } = await supabase
    .from('messages')
    .select(`
      *,
      files:message_files!left (
        file:files (
          id
        )
      )
    `)
    .eq('id', messageId)
    .single();

  if (!message) throw new AppError('Message not found', 404);
  if (message.user_id !== userId) throw new AppError('Access denied', 403);

  // Delete associated files
  if (message.files) {
    for (const fileRelation of message.files) {
      await fileService.deleteFile(fileRelation.file.id);
    }
  }

  // The message_files records will be automatically deleted due to CASCADE
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
        .filter((f: any) => f.file) // Filter out null files
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

  // Check channel access (reuse existing access check logic)
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

  // Get thread messages with user information
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

  // Get workspace members for the channel's workspace
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
        reactions: {},  // Initialize empty for thread messages
        userReactions: []  // Initialize empty for thread messages
      };
    }) as EnrichedMessage[];

    return transformedMessages;
  }

  return [];
};

export const createMessageWithFile = async (
  channelId: string,
  userId: string,
  content: string,
  file?: Express.Multer.File,
  parentMessageId?: string
): Promise<EnrichedMessage> => {
  const logContext = {
    channelId,
    userId,
    parentMessageId,
    hasFile: !!file
  };

  console.log('[Message Creation] Starting process:', logContext);

  try {
    // If there's a file, upload it first
    let uploadedFile;
    if (file) {
      uploadedFile = await fileService.uploadFile(channelId, userId, file);
    }

    // Create the message
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
        parent_message_id: parentMessageId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Message Creation] Failed to insert:', { ...logContext, error: insertError });
      throw new AppError(insertError.message, 500);
    }

    // If we have an uploaded file, link it to the message
    if (uploadedFile) {
      await fileService.linkFilesToMessage(insertedMessage.id, [uploadedFile.id]);
    }

    // Fetch the complete message with all related data
    const { data: fullMessage, error: fetchError } = await supabase
      .from('messages')
      .select(`
        *,
        channels!inner (
          workspace_id
        ),
        users!inner (
          name
        ),
        files:message_files!left (
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
      .eq('id', insertedMessage.id)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);

    // Process files array
    const files = fullMessage.files?.map((rel: any) => rel.file) || [];
    
    // Enrich with additional data
    const enriched = await enrichMessageWithDetails(fullMessage, userId);
    
    return {
      ...enriched,
      files
    };

  } catch (error) {
    console.error('[Message Creation] Unexpected error:', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}; 