import supabase from '../../config/supabaseClient';
import AppError from '../../types/AppError';
import { fileDBService } from './fileDBService';

export const fileAccessService = {
    async verifyFileAccess(fileId: string, userId: string): Promise<void> {
        const { data: file } = await supabase
          .from('files')
          .select(`
            *,
            channels!inner (
              workspace_id,
              is_private
            )
          `)
          .eq('id', fileId)
          .single();
    
        if (!file) throw new AppError('File not found', 404);
    
        // Check channel membership
        const { data: membership } = await supabase
          .from('channel_members')
          .select('role')
          .eq('channel_id', file.channel_id)
          .eq('user_id', userId)
          .single();
    
        if (!membership && file.channels.is_private) {
          // For private channels, must be a member
          throw new AppError('Access denied', 403);
        }
    
        if (!membership) {
          // For public channels, check workspace membership
          const { data: workspaceMember } = await supabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', file.channels.workspace_id)
            .eq('user_id', userId)
            .single();
    
          if (!workspaceMember) throw new AppError('Access denied', 403);
        }
      }
}; 