# Clones Feature Overview

## Introduction
The Clones feature allows for the creation and management of AI clones that can be trained on specific documents and interacted with through chat. Each clone can be associated with a workspace and can have multiple training documents.

## Authentication
All endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Types

### Clone
```typescript
type CloneVisibility = 'global' | 'private';

interface Clone {
    id: string;
    name: string;
    description: string | null;
    base_prompt: string;
    visibility: CloneVisibility;
    workspace_id: string | null;
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
}
```

### Document
```typescript
type DocumentStatus = 'pending' | 'processed' | 'failed';

interface CloneDocument {
    id: string;
    clone_id: string;
    file_name: string;
    file_type: string;
    status: DocumentStatus;
    uploaded_at: string;
    processed_at: string | null;
    pinecone_index: string;
}
```

## API Endpoints

### Clone Management

#### Create Clone
```
POST /api/clones
```
Request Body:
```typescript
{
    name: string;
    description?: string;
    base_prompt: string;
    visibility: CloneVisibility;
    workspace_id?: string;
}
```
Response: `Clone` object

#### List Clones
```
GET /api/clones?workspace_id={workspace_id}
```
Query Parameters:
- `workspace_id` (optional): Filter clones by workspace
Response: Array of `Clone` objects with their documents

#### Get Clone
```
GET /api/clones/{id}
```
Response: `Clone` object with its documents

#### Update Clone
```
PUT /api/clones/{id}
```
Request Body: Partial `Clone` object
Response: Updated `Clone` object

#### Delete Clone
```
DELETE /api/clones/{id}
```
Response: 204 No Content

### Document Management

#### Upload Document
```
POST /api/clones/{clone_id}/documents
```
Request:
- Content-Type: multipart/form-data
- Body:
  - file: File (PDF, TXT, etc.)

Response:
```typescript
{
    document: CloneDocument;
    uploadResult: {
        success: boolean;
        message: string;
    }
}
```

### Chat Integration

#### Chat with Clone
```
POST /api/clones/{clone_id}/chat
```
Request Body:
```typescript
{
    message: {
        text: string;
        history: Array<{
            role: string;
            content: string;
        }>;
    };
    workspace_id?: string;
    channel_id?: string;
}
```
Response:
```typescript
{
    response: string;
    context?: Record<string, any>;
}
```

### Health Check

#### Check AI Service Health
```
GET /api/clones/health
```
Response:
```typescript
{
    status: 'healthy' | 'unhealthy';
    message: string;
}
```

## Error Handling

All endpoints follow this error response format:
```typescript
{
    error: string;
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable (AI service down)

## Environment Variables Required
```env
PYTHON_SERVICE_URL=http://localhost:8000
PYTHON_SERVICE_API_KEY=your_api_key
PINECONE_INDEX=your_pinecone_index
```

## Example Usage

### Creating and Training a Clone
```typescript
// 1. Create a clone
const clone = await api.post('/api/clones', {
    name: 'History Expert',
    description: 'Expert in world history',
    base_prompt: 'You are a history expert...',
    visibility: 'private',
    workspace_id: 'workspace-123'
});

// 2. Upload training document
const formData = new FormData();
formData.append('file', documentFile);
await api.post(`/api/clones/${clone.id}/documents`, formData);

// 3. Chat with clone
const chatResponse = await api.post(`/api/clones/${clone.id}/chat`, {
    message: {
        text: 'Tell me about World War II',
        history: []
    },
    workspace_id: 'workspace-123',
    channel_id: 'channel-456'
});
```

## Notes
- File uploads are limited to 10MB per file
- Supported file types: PDF, TXT, DOCX
- Chat history should be maintained client-side and sent with each request
- For workspace-specific clones, always include the workspace_id in requests
