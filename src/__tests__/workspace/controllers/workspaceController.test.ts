import { createWorkspace, getUserWorkspaces, getWorkspacebyId, updateWorkspacebyId, deleteWorkspace } from '../../../workspace/controllers/workspaceController';
import * as workspaceService from '../../../workspace/services/workspaceService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../workspace/services/workspaceService');

// Tests the workspace controller's:
// 1. Workspace creation with validation
// 2. Workspace retrieval (single and list)
// 3. Workspace updates with permission checks
// 4. Workspace deletion with cascade
describe('workspaceController', () => {
    const mockWorkspace = {
        id: 'test-workspace-id',
        name: 'Test Workspace',
        workspace_url: 'test-workspace',
        owner_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createWorkspace', () => {
        const createWorkspaceData = {
            name: 'Test Workspace',
            workspace_url: 'test-workspace'
        };

        // Tests successful workspace creation with valid data
        // Verifies: Status code, response format, service call
        it('should create a workspace successfully', async () => {
            const mockRequest = createMockRequest({
                ...createWorkspaceData,
                user: { id: 'test-user-id' }
            });
            const mockResponse = createMockResponse();

            (workspaceService.createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace);

            await createWorkspace(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockWorkspace);
        });

        // Tests authentication requirement for workspace creation
        // Verifies: Unauthorized access handling
        it('should handle missing authentication', async () => {
            const mockRequest = createMockRequest(createWorkspaceData);
            const mockResponse = createMockResponse();

            await createWorkspace(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        // Tests error handling for service-level failures
        // Verifies: Error status codes, error messages
        it('should handle service errors', async () => {
            const mockRequest = createMockRequest({
                ...createWorkspaceData,
                user: { id: 'test-user-id' }
            });
            const mockResponse = createMockResponse();

            const error = new AppError('Workspace URL already exists', 400);
            (workspaceService.createWorkspace as jest.Mock).mockRejectedValue(error);

            await createWorkspace(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Workspace URL already exists'
            });
        });
    });

    describe('getUserWorkspaces', () => {
        it('should return user workspaces', async () => {
            const mockRequest = createMockRequest({
                user: { id: 'test-user-id' }
            });
            const mockResponse = createMockResponse();

            (workspaceService.getUserWorkspaces as jest.Mock).mockResolvedValue([mockWorkspace]);

            await getUserWorkspaces(mockRequest as any, mockResponse as any);

            expect(mockResponse.json).toHaveBeenCalledWith([mockWorkspace]);
        });

        it('should handle missing authentication', async () => {
            const mockRequest = createMockRequest({});
            const mockResponse = createMockResponse();

            await getUserWorkspaces(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });
    });

    describe('getWorkspaceById', () => {
        it('should return workspace details', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            (workspaceService.getWorkspaceById as jest.Mock).mockResolvedValue(mockWorkspace);

            await getWorkspacebyId(mockRequest as any, mockResponse as any);

            expect(mockResponse.json).toHaveBeenCalledWith(mockWorkspace);
        });

        it('should handle non-existent workspace', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'non-existent-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Workspace not found', 404);
            (workspaceService.getWorkspaceById as jest.Mock).mockRejectedValue(error);

            await getWorkspacebyId(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Workspace not found'
            });
        });
    });

    describe('updateWorkspaceById', () => {
        const updateData = {
            name: 'Updated Workspace Name',
            workspace_url: 'updated-workspace'
        };

        it('should update workspace successfully', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            const updatedWorkspace = { ...mockWorkspace, ...updateData };
            (workspaceService.updateWorkspace as jest.Mock).mockResolvedValue(updatedWorkspace);

            await updateWorkspacebyId(mockRequest as any, mockResponse as any);

            expect(workspaceService.updateWorkspace).toHaveBeenCalledWith(
                'test-workspace-id',
                'test-user-id',
                updateData
            );
            expect(mockResponse.json).toHaveBeenCalledWith(updatedWorkspace);
        });

        it('should handle unauthorized update attempt', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { workspaceId: 'test-workspace-id' }
            );
            const mockResponse = createMockResponse();

            await updateWorkspacebyId(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        it('should handle non-existent workspace update', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { workspaceId: 'non-existent-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Workspace not found', 404);
            (workspaceService.updateWorkspace as jest.Mock).mockRejectedValue(error);

            await updateWorkspacebyId(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Workspace not found'
            });
        });
    });

    describe('deleteWorkspace', () => {
        it('should delete workspace successfully', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            (workspaceService.deleteWorkspace as jest.Mock).mockResolvedValue(undefined);

            await deleteWorkspace(mockRequest as any, mockResponse as any);

            expect(workspaceService.deleteWorkspace).toHaveBeenCalledWith(
                'test-workspace-id',
                'test-user-id'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle unauthorized deletion attempt', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' }
            );
            const mockResponse = createMockResponse();

            await deleteWorkspace(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        it('should handle non-existent workspace deletion', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'non-existent-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Workspace not found', 404);
            (workspaceService.deleteWorkspace as jest.Mock).mockRejectedValue(error);

            await deleteWorkspace(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Workspace not found'
            });
        });
    });
}); 