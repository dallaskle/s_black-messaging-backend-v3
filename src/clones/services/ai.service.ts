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
            return response.data;
        } catch (error) {
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
        try {
            const response = await this.axiosInstance.post(PYTHON_SERVICE_CONFIG.endpoints.chat, payload);
            return response.data;
        } catch (error) {
            this.handleError(error as AxiosError);
        }
    }

    async checkHealth() {
        try {
            const response = await this.axiosInstance.get(PYTHON_SERVICE_CONFIG.endpoints.health);
            return response.data;
        } catch (error) {
            this.handleError(error as AxiosError);
        }
    }

    private handleError(error: AxiosError) {
        if (error.response) {
            throw new Error(`AI Service Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            throw new Error('AI Service Error: No response received');
        } else {
            throw new Error(`AI Service Error: ${error.message}`);
        }
    }
}

export const aiService = new AIService(); 