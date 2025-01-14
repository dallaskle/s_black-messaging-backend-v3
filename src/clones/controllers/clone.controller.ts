import { Request, Response } from 'express';
import { cloneService } from '../services/clone.service';
import { aiService } from '../services/ai.service';
import type { Clone } from '../../types/database';

export class CloneController {
    async createClone(req: Request, res: Response) {
        try {
            const cloneData: Omit<Clone, 'id' | 'created_at' | 'updated_at'> = req.body;
            const clone = await cloneService.createClone(cloneData);
            res.status(201).json(clone);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async getClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clone = await cloneService.getClone(id);
            res.json(clone);
        } catch (error) {
            res.status(404).json({ error: 'Clone not found' });
        }
    }

    async listClones(req: Request, res: Response) {
        try {
            const { workspace_id } = req.query;
            const clones = await cloneService.listClones(workspace_id as string);
            res.json(clones);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async updateClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const clone = await cloneService.updateClone(id, updateData);
            res.json(clone);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async deleteClone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await cloneService.deleteClone(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async uploadDocument(req: Request, res: Response) {
        try {
            const { clone_id } = req.params;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            const pineconeIndex = process.env.PINECONE_INDEX;
            if (!pineconeIndex) {
                return res.status(500).json({ error: 'Pinecone index not configured' });
            }

            // Upload to Python service
            const uploadResult = await aiService.uploadDocument(file, clone_id, pineconeIndex);

            // Create document record
            const document = await cloneService.addDocument({
                clone_id,
                file_name: file.originalname,
                file_type: file.mimetype,
                status: 'pending',
                pinecone_index: pineconeIndex
            });

            res.status(201).json({ document, uploadResult });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async chat(req: Request, res: Response) {
        try {
            const { clone_id } = req.params;
            const { message, workspace_id, channel_id } = req.body;

            const clone = await cloneService.getClone(clone_id);
            if (!clone) {
                return res.status(404).json({ error: 'Clone not found' });
            }

            const pineconeIndex = process.env.PINECONE_INDEX;
            if (!pineconeIndex) {
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

            if (!req.user?.id) {
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

            res.json(chatResult);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async checkHealth(req: Request, res: Response) {
        try {
            const health = await aiService.checkHealth();
            res.json(health);
        } catch (error) {
            res.status(503).json({ error: 'AI service unavailable' });
        }
    }
} 