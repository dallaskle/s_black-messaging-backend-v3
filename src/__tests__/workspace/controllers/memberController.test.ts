import { getWorkspaceMembers, addMember, updateMember, removeMember } from '../../../workspace/controllers/memberController';
import * as memberService from '../../../workspace/services/memberService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';

jest.mock('../../../workspace/services/memberService');

describe('memberController', () => {
    const mockMember = {
        workspace_id: 'test-workspace-id',
        user_id: 'test-user-id',
        role: 'member',
        display_name: 'Test User',
        joined_at: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWorkspaceMembers', () => {
        it('should return workspace members successfully', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'test-user-id' } }
            );
            const mockResponse = createMockResponse();

            (memberService.getWorkspaceMembers as jest.Mock).mockResolvedValue([mockMember]);

            await getWorkspaceMembers(mockRequest as any, mockResponse as any);

            expect(memberService.getWorkspaceMembers).toHaveBeenCalledWith(
                'test-workspace-id',
                'test-user-id'
            );
            expect(mockResponse.json).toHaveBeenCalledWith([mockMember]);
        });

        it('should handle unauthorized access', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' }
            );
            const mockResponse = createMockResponse();

            await getWorkspaceMembers(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });
    });

    describe('addMember', () => {
        const addMemberData = {
            userId: 'new-user-id',
            role: 'member'
        };

        it('should add member successfully', async () => {
            const mockRequest = createMockRequest(
                addMemberData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const newMember = { ...mockMember, user_id: addMemberData.userId };
            (memberService.addWorkspaceMember as jest.Mock).mockResolvedValue(newMember);

            await addMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(newMember);
        });

        it('should handle duplicate member', async () => {
            const mockRequest = createMockRequest(
                addMemberData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('User is already a member', 400);
            (memberService.addWorkspaceMember as jest.Mock).mockRejectedValue(error);

            await addMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User is already a member'
            });
        });
    });

    describe('updateMember', () => {
        const updateData = {
            role: 'admin',
            display_name: 'Updated Name'
        };

        it('should update member successfully', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'member-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const updatedMember = { ...mockMember, ...updateData };
            (memberService.updateWorkspaceMember as jest.Mock).mockResolvedValue(updatedMember);

            await updateMember(mockRequest as any, mockResponse as any);

            expect(memberService.updateWorkspaceMember).toHaveBeenCalledWith(
                'test-workspace-id',
                'admin-id',
                'member-id',
                updateData
            );
            expect(mockResponse.json).toHaveBeenCalledWith(updatedMember);
        });

        it('should handle unauthorized update attempt', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'member-id'
                }
            );
            const mockResponse = createMockResponse();

            await updateMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        it('should handle non-existent member update', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'non-existent-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Member not found', 404);
            (memberService.updateWorkspaceMember as jest.Mock).mockRejectedValue(error);

            await updateMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Member not found'
            });
        });

        it('should handle insufficient permissions', async () => {
            const mockRequest = createMockRequest(
                updateData,
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'member-id'
                },
                { user: { id: 'non-admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Access denied', 403);
            (memberService.updateWorkspaceMember as jest.Mock).mockRejectedValue(error);

            await updateMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Access denied'
            });
        });
    });

    describe('removeMember', () => {
        it('should remove member successfully', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'member-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            (memberService.removeWorkspaceMember as jest.Mock).mockResolvedValue(undefined);

            await removeMember(mockRequest as any, mockResponse as any);

            expect(memberService.removeWorkspaceMember).toHaveBeenCalledWith(
                'test-workspace-id',
                'admin-id',
                'member-id'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle unauthorized removal attempt', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'member-id'
                }
            );
            const mockResponse = createMockResponse();

            await removeMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        it('should prevent self-removal for last admin', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'admin-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Cannot remove the last admin', 400);
            (memberService.removeWorkspaceMember as jest.Mock).mockRejectedValue(error);

            await removeMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cannot remove the last admin'
            });
        });

        it('should handle non-existent member removal', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    userId: 'non-existent-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Member not found', 404);
            (memberService.removeWorkspaceMember as jest.Mock).mockRejectedValue(error);

            await removeMember(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Member not found'
            });
        });
    });
}); 