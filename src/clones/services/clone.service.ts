import supabase from '../../config/supabaseClient';
import type { Clone, CloneDocument, AIInteraction } from '../../types/database';

class CloneService {
    async createClone(data: Omit<Clone, 'id' | 'created_at' | 'updated_at'>) {
        console.log('[CloneService] Creating clone with data:', data);
        const { data: clone, error } = await supabase
            .from('clones')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.log('[CloneService] Error creating clone:', error);
            throw error;
        }
        console.log('[CloneService] Clone created:', clone);
        return clone;
    }

    async getClone(id: string) {
        console.log('[CloneService] Fetching clone:', id);
        const { data: clone, error } = await supabase
            .from('clones')
            .select('*, clone_documents(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.log('[CloneService] Error fetching clone:', error);
            throw error;
        }
        console.log('[CloneService] Clone fetched:', clone);
        return clone;
    }

    async listClones(workspaceId?: string) {
        console.log('[CloneService] Listing clones for workspace:', workspaceId || 'global');
        let query = supabase
            .from('clones')
            .select('*, clone_documents(*)');

        if (workspaceId) {
            query = query.or(`workspace_id.eq.${workspaceId},visibility.eq.global`);
        } else {
            query = query.eq('visibility', 'global');
        }

        const { data: clones, error } = await query;
        if (error) {
            console.log('[CloneService] Error listing clones:', error);
            throw error;
        }
        console.log('[CloneService] Found clones:', clones?.length);
        return clones;
    }

    async updateClone(id: string, data: Partial<Omit<Clone, 'id' | 'created_at' | 'updated_at'>>) {
        console.log('[CloneService] Updating clone:', id, 'with data:', data);
        const { data: clone, error } = await supabase
            .from('clones')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.log('[CloneService] Error updating clone:', error);
            throw error;
        }
        console.log('[CloneService] Clone updated:', clone);
        return clone;
    }

    async deleteClone(id: string) {
        console.log('[CloneService] Deleting clone:', id);
        const { error } = await supabase
            .from('clones')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('[CloneService] Error deleting clone:', error);
            throw error;
        }
        console.log('[CloneService] Clone deleted successfully');
    }

    async addDocument(data: Omit<CloneDocument, 'id' | 'uploaded_at' | 'processed_at'>) {
        console.log('[CloneService] Adding document for clone:', data.clone_id);
        const { data: document, error } = await supabase
            .from('clone_documents')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.log('[CloneService] Error adding document:', error);
            throw error;
        }
        console.log('[CloneService] Document added:', document);
        return document;
    }

    async updateDocumentStatus(id: string, status: CloneDocument['status']) {
        console.log('[CloneService] Updating document status:', id, 'to:', status);
        const { data: document, error } = await supabase
            .from('clone_documents')
            .update({ 
                status, 
                processed_at: status === 'processed' ? new Date().toISOString() : null 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.log('[CloneService] Error updating document status:', error);
            throw error;
        }
        console.log('[CloneService] Document status updated:', document);
        return document;
    }

    async logInteraction(data: Omit<AIInteraction, 'id' | 'created_at'>) {
        console.log('[CloneService] Logging interaction for clone:', data.clone_id);
        const { data: interaction, error } = await supabase
            .from('ai_interactions')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.log('[CloneService] Error logging interaction:', error);
            throw error;
        }
        console.log('[CloneService] Interaction logged:', interaction);
        return interaction;
    }
}

export const cloneService = new CloneService(); 