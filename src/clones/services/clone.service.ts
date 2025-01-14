import supabase from '../../config/supabaseClient';
import type { Clone, CloneDocument, AIInteraction } from '../../types/database';

class CloneService {
    async createClone(data: Omit<Clone, 'id' | 'created_at' | 'updated_at'>) {
        const { data: clone, error } = await supabase
            .from('clones')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return clone;
    }

    async getClone(id: string) {
        const { data: clone, error } = await supabase
            .from('clones')
            .select('*, clone_documents(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return clone;
    }

    async listClones(workspaceId?: string) {
        let query = supabase
            .from('clones')
            .select('*, clone_documents(*)');

        if (workspaceId) {
            query = query.or(`workspace_id.eq.${workspaceId},visibility.eq.global`);
        } else {
            query = query.eq('visibility', 'global');
        }

        const { data: clones, error } = await query;
        if (error) throw error;
        return clones;
    }

    async updateClone(id: string, data: Partial<Omit<Clone, 'id' | 'created_at' | 'updated_at'>>) {
        const { data: clone, error } = await supabase
            .from('clones')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return clone;
    }

    async deleteClone(id: string) {
        const { error } = await supabase
            .from('clones')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async addDocument(data: Omit<CloneDocument, 'id' | 'uploaded_at' | 'processed_at'>) {
        const { data: document, error } = await supabase
            .from('clone_documents')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return document;
    }

    async updateDocumentStatus(id: string, status: CloneDocument['status']) {
        const { data: document, error } = await supabase
            .from('clone_documents')
            .update({ 
                status, 
                processed_at: status === 'processed' ? new Date().toISOString() : null 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return document;
    }

    async logInteraction(data: Omit<AIInteraction, 'id' | 'created_at'>) {
        const { data: interaction, error } = await supabase
            .from('ai_interactions')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return interaction;
    }
}

export const cloneService = new CloneService(); 