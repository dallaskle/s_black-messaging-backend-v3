import { serviceClient } from '../../config/supabaseClient';

const STORAGE_BUCKET = process.env.SUPABASE_FILE_STORAGE_TABLE || 's-black-messaging-files';

export const getSignedUrl = async (file: any) => {
  console.log('[File URL Signing] Initiating for file:', { fileId: file.id, fileUrl: file.file_url });
  try {
    const fileUrl = new URL(file.file_url);
    const pathParts = fileUrl.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public') + 1;
    const filePath = pathParts.slice(bucketIndex).join('/');
    
    const { data, error } = await serviceClient
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('[File URL Signing] Failed to create signed URL:', { 
        fileId: file.id, 
        error,
        filePath 
      });
      return file.file_url;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[File URL Signing] Error occurred:', { 
      fileId: file.id, 
      error: error instanceof Error ? error.message : error 
    });
    return file.file_url;
  }
};