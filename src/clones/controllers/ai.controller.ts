import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

class AIController {
    async messageSearch(req: Request, res: Response): Promise<void> {
        const base_prompt = "you are a search engine and are supposed to respond to the query based on the provided context. Provide only answers, not questions."
        const pinecone_index = 'message-vectors'
        try {
            const { workspace_id, channel_id, query } = req.body;

            if (!workspace_id  || !query) {
                res.status(400).json({
                    error: 'Missing required parameters'
                });
                return;
            }

            const result = await aiService.messageSearch({
                workspace_id,
                channel_id,
                base_prompt,
                pinecone_index,
                query
            });

            res.json(result);
        } catch (error) {
            console.error('[AIController] Message search failed:', error);
            res.status(500).json({
                error: 'Failed to perform message search'
            });
        }
    }
}

export const aiController = new AIController();
