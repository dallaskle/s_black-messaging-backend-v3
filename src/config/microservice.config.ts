import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PYTHON_SERVICE_URL || !process.env.PYTHON_SERVICE_API_KEY) {
    throw new Error('Missing required Python service environment variables');
}

export const PYTHON_SERVICE_CONFIG = {
    baseUrl: process.env.PYTHON_SERVICE_URL,
    apiKey: process.env.PYTHON_SERVICE_API_KEY,
    endpoints: {
        upload: '/documents',
        chat: '/chat',
        health: '/health',
        messageSearch: '/message-search'
    },
    timeout: 120000, // 120 seconds
    retries: 3
} as const; 