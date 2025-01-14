import axios, { AxiosError } from 'axios';
import { PYTHON_SERVICE_CONFIG } from '../../config/microservice.config';

class AIService {
    private readonly axiosInstance = axios.create({
        baseURL: PYTHON_SERVICE_CONFIG.baseUrl,
        timeout: PYTHON_SERVICE_CONFIG.timeout,
        headers: {
            'X-API-Key': PYTHON_SERVICE_CONFIG.apiKey
        }
    });

    async uploadDocument(file: Express.Multer.File, cloneId: string, pineconeIndex: string) {
        console.log('[AIService] Uploading document to Python service:', {
            cloneId,
            fileName: file.originalname,
            fileSize: file.size,
            pineconeIndex
        });

        const formData = new FormData();
        formData.append('file', new Blob([file.buffer]), file.originalname);
        formData.append('clone_id', cloneId);
        formData.append('pinecone_index', pineconeIndex);

        try {
            const response = await this.axiosInstance.post(PYTHON_SERVICE_CONFIG.endpoints.upload, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('[AIService] Document upload successful:', response.data);
            return response.data;
        } catch (error) {
            console.log('[AIService] Document upload failed');
            this.handleError(error as AxiosError);
        }
    }

    async chat(payload: {
        messages: Array<{ role: string; content: string }>;
        clone_id: string;
        workspace_id?: string;
        channel_id?: string;
        base_prompt: string;
        pinecone_index: string;
        query: string;
    }) {
        console.log('[AIService] Sending chat request:', {
            cloneId: payload.clone_id,
            workspaceId: payload.workspace_id,
            channelId: payload.channel_id,
            query: payload.query,
            messageCount: payload.messages.length
        });

        try {
            const response = await this.axiosInstance.post(PYTHON_SERVICE_CONFIG.endpoints.chat, payload);
            console.log('[AIService] Chat response received:', {
                cloneId: payload.clone_id,
                responseLength: response.data.response?.length || 0,
                hasContext: !!response.data.context
            });
            return response.data;
        } catch (error) {
            console.log('[AIService] Chat request failed');
            this.handleError(error as AxiosError);
        }
    }

    async checkHealth() {
        console.log('[AIService] Checking Python service health');
        try {
            const response = await this.axiosInstance.get(PYTHON_SERVICE_CONFIG.endpoints.health);
            console.log('[AIService] Health check response:', response.data);
            return response.data;
        } catch (error) {
            console.log('[AIService] Health check failed');
            this.handleError(error as AxiosError);
        }
    }

    private handleError(error: AxiosError) {
        if (error.response) {
            console.log('[AIService] Error response:', {
                status: error.response.status,
                data: error.response.data
            });
            throw new Error(`AI Service Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.log('[AIService] No response received from Python service');
            throw new Error('AI Service Error: No response received');
        } else {
            console.log('[AIService] Request setup error:', error.message);
            throw new Error(`AI Service Error: ${error.message}`);
        }
    }
}

export const aiService = new AIService(); 