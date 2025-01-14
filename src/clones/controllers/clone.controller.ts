import { Request, Response } from 'express';
import { cloneService } from '../services/clone.service';
import { aiService } from '../services/ai.service';
import type { Clone } from '../../types/database';

export class CloneController {
    async createClone(req: Request, res: Response) {
        try {
            console.log('[CloneController] Creating new clone:', req.body);
            
            if (!req.user?.id) {
                console.log('[CloneController] Error: User not authenticated');
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const cloneData: Omit<Clone, 'id' | 'created_at' | 'updated_at'> = {
                ...req.body,
                created_by_user_id: req.user.id
            };
            const clone = await cloneService.createClone(cloneData);
            console.log('[CloneController] Clone created successfully:', clone);
            res.status(201).json(clone);
        } catch (error) {
            console.log('[CloneController] Error creating clone:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async getClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log('[CloneController] Fetching clone:', id);
            const clone = await cloneService.getClone(id);
            console.log('[CloneController] Clone fetched successfully:', clone);
            res.json(clone);
        } catch (error) {
            console.log('[CloneController] Error fetching clone:', error);
            res.status(404).json({ error: 'Clone not found' });
        }
    }

    async listClones(req: Request, res: Response) {
        try {
            const { workspace_id } = req.query;
            console.log('[CloneController] Listing clones for workspace:', workspace_id || 'global');
            const clones = await cloneService.listClones(workspace_id as string);
            console.log('[CloneController] Found clones:', clones.length);
            res.json(clones);
        } catch (error) {
            console.log('[CloneController] Error listing clones:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async updateClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log('[CloneController] Updating clone:', id, 'with data:', req.body);
            const updateData = req.body;
            const clone = await cloneService.updateClone(id, updateData);
            console.log('[CloneController] Clone updated successfully:', clone);
            res.json(clone);
        } catch (error) {
            console.log('[CloneController] Error updating clone:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async deleteClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            console.log('[CloneController] Deleting clone:', id);
            await cloneService.deleteClone(id);
            console.log('[CloneController] Clone deleted successfully');
            res.status(204).send();
        } catch (error) {
            console.log('[CloneController] Error deleting clone:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async uploadDocument(req: Request, res: Response) {
        try {
            const { clone_id } = req.params;
            const file = req.file;
            console.log('[CloneController] Uploading document for clone:', clone_id, 'filename:', file?.originalname);
            
            if (!file) {
                console.log('[CloneController] Error: No file provided');
                return res.status(400).json({ error: 'No file provided' });
            }

            const pineconeIndex = process.env.PINECONE_INDEX;
            if (!pineconeIndex) {
                console.log('[CloneController] Error: Pinecone index not configured');
                return res.status(500).json({ error: 'Pinecone index not configured' });
            }

            // Upload to Python service
            const uploadResult = await aiService.uploadDocument(file, clone_id, pineconeIndex);
            console.log('[CloneController] Document uploaded to AI service:', uploadResult);

            // Create document record
            const document = await cloneService.addDocument({
                clone_id,
                file_name: file.originalname,
                file_type: file.mimetype,
                status: 'pending',
                pinecone_index: pineconeIndex
            });
            console.log('[CloneController] Document record created:', document);

            res.status(201).json({ document, uploadResult });
        } catch (error) {
            console.log('[CloneController] Error uploading document:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async chat(req: Request, res: Response) {
        try {
            const { clone_id } = req.params;
            const { message, workspace_id, channel_id } = req.body;
            console.log('[CloneController] Chat request for clone:', clone_id, 'message:', message.text);

            const clone = await cloneService.getClone(clone_id);
            if (!clone) {
                console.log('[CloneController] Error: Clone not found');
                return res.status(404).json({ error: 'Clone not found' });
            }

            const pineconeIndex = process.env.PINECONE_INDEX;
            if (!pineconeIndex) {
                console.log('[CloneController] Error: Pinecone index not configured');
                return res.status(500).json({ error: 'Pinecone index not configured' });
            }

            const chatResult = await aiService.chat({
                messages: message.history,
                clone_id,
                workspace_id,
                channel_id,
                base_prompt: clone.base_prompt,
                pinecone_index: pineconeIndex,
                query: message.text
            });
            console.log('[CloneController] Chat response received:', chatResult);

            if (!req.user?.id) {
                console.log('[CloneController] Error: User not authenticated');
                return res.status(401).json({ error: 'User not authenticated' });
            }

            // Log the interaction
            await cloneService.logInteraction({
                user_id: req.user.id,
                clone_id,
                workspace_id,
                channel_id,
                query: message.text,
                context: chatResult.context,
                response: chatResult.response
            });
            console.log('[CloneController] Interaction logged successfully');

            res.json(chatResult);
        } catch (error) {
            console.log('[CloneController] Error in chat:', error);
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async checkHealth(req: Request, res: Response) {
        try {
            console.log('[CloneController] Checking AI service health');
            const health = await aiService.checkHealth();
            console.log('[CloneController] Health check result:', health);
            res.json(health);
        } catch (error) {
            console.log('[CloneController] Error checking health:', error);
            res.status(503).json({ error: 'AI service unavailable' });
        }
    }
} 