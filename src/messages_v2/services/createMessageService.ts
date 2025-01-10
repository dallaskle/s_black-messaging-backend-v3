import supabase from '../../config/supabaseClient';
import { EnrichedMessage } from '../../types/database';
import AppError from '../../types/AppError';
import { fileService } from '../../files/services/fileService';
import { enrichMessageWithDetails } from '../utils/messageEnricher';

export const createMessage = async (
  channelId: string,
  userId: string,
  content: string,
  parentMessageId?: string,
  fileIds?: string[]
): Promise<EnrichedMessage> => {
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

    // Fetch the newly created message with related data
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

    // Process files array
    const newFiles = fullMessage.files?.map((rel: any) => rel.file) || [];
    
    // Enrich with additional data
    const enriched = await enrichMessageWithDetails(fullMessage, userId);
    
    return {
      ...enriched,
      files: newFiles
    };

  } catch (error) {
    throw error;
  }
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
      
      if (!uploadedFile?.file_url) {
        console.error('[Message Creation] File upload failed - missing URL:', uploadedFile);
        throw new AppError('File upload failed - missing URL', 500);
      }
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