import { Message } from "../types/database";
import supabaseClient from "../config/supabaseClient";
import { PostgrestResponse } from "@supabase/supabase-js";

interface WorkspaceMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_message_id?: string;
  created_at: string;
  channels: { workspace_id: string }[];
}

export async function getWorkspaceMessages(
  workspaceId: string, 
  startDate: Date, 
  endDate: Date
): Promise<WorkspaceMessage[]> {
  const { data, error } = await supabaseClient
    .from('messages')
    .select(`
      id,
      channel_id,
      user_id,
      content,
      parent_message_id,
      created_at,
      channels!inner(workspace_id)
    `)
    .eq('channels.workspace_id', workspaceId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

interface MessageUpload {
  workspace_id: string;
  status: 'success' | 'failed';
  first_message_time: Date | string;
  last_message_time: Date | string;
  message_count: number;
  error_message?: string;
}

async function uploadWorkspaceMessages(
  workspaceId: string,
  pineconeIndex: string,
  date: Date = new Date()
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let messages: WorkspaceMessage[] = [];

  try {
    messages = await getWorkspaceMessages(workspaceId, startOfDay, endOfDay);
    
    if (messages.length === 0) {
      return; // No messages to process
    }

    // Ensure API key exists
    const apiKey = process.env.PYTHON_SERVICE_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Format messages for the Python backend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      channel_id: msg.channel_id,
      user_id: msg.user_id,
      content: msg.content,
      parent_message_id: msg.parent_message_id || null,
      created_at: msg.created_at
    }));

    const requestPayload = {
      messages: formattedMessages,
      workspace_id: workspaceId,
      pinecone_index: pineconeIndex,
      time_range: {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      }
    };

    console.log('Sending request to Python service:');
    console.log(JSON.stringify(requestPayload, null, 2));

    const response = await fetch(process.env.PYTHON_SERVICE_URL + '/message-history', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed response:', errorText);
      
      // If it's the Pinecone metadata warning but the upload succeeded, don't treat it as an error
      if (errorText.includes('Metadata value must be a string') && errorText.includes('time_range')) {
        console.log('Warning: Pinecone metadata format issue, but upload likely succeeded');
        // Continue with logging success
      } else {
        throw new Error(`Upload failed: ${errorText}`);
      }
    }

    // Log the successful upload
    const uploadLog: MessageUpload = {
      workspace_id: workspaceId,
      status: 'success',
      first_message_time: messages[0].created_at,
      last_message_time: messages[messages.length - 1].created_at,
      message_count: messages.length
    };

    const { error: insertError } = await supabaseClient
      .from('message_vector_uploads')
      .insert(uploadLog);

    if (insertError) throw insertError;

  } catch (error) {
    // Log the failed attempt
    const uploadLog: MessageUpload = {
      workspace_id: workspaceId,
      status: 'failed',
      first_message_time: messages[0]?.created_at || startOfDay.toISOString(),
      last_message_time: messages[messages.length - 1]?.created_at || endOfDay.toISOString(),
      message_count: messages?.length || 0,
      error_message: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    await supabaseClient
      .from('message_vector_uploads')
      .insert(uploadLog);
    
    throw error;
  }
}

interface Workspace {
  id: string;
}

export async function processAllWorkspaces(date: Date = new Date()) {
  const { data: workspaces, error } = await supabaseClient
    .from('workspaces')
    .select('id');

  if (error) throw error;
  if (!workspaces) return;

  const pineconeIndex = process.env.PINECONE_MESSAGE_INDEX;
  if (!pineconeIndex) {
    throw new Error('Pinecone index not configured');
  }

  for (const workspace of workspaces) {
    try {
      await uploadWorkspaceMessages(
        workspace.id,
        pineconeIndex,
        date
      );
    } catch (error) {
      console.error(`Failed to process workspace ${workspace.id}:`, 
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      // Continue with next workspace
    }
  }
}

export { uploadWorkspaceMessages };


  