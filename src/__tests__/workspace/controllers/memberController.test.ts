import { getWorkspaceMembers, addMember, updateMember, removeMember } from '../../../workspace/controllers/memberController';
import * as memberService from '../../../workspace/services/memberService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';
import { MemberRole } from '../../../types/database';

jest.mock('../../../workspace/services/memberService');

// Tests the member controller's:
// 1. Member listing with permissions
// 2. Member addition with role assignment
// 3. Member updates (role and display name)
// 4. Member removal with admin protection
describe('memberController', () => {
    const mockMember = {
        workspace_id: 'test-workspace-id',
        user_id: 'test-user-id',
        role: 'member' as MemberRole,
        display_name: 'Test User',
        joined_at: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWorkspaceMembers', () => {
        // Tests successful retrieval of workspace members
        // Verifies: Response format, service call parameters
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

        // Tests authentication requirement for member listing
        // Verifies: Unauthorized access handling
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
            role: 'member' as MemberRole
        };

        // Tests successful member addition
        // Verifies: Status code, response format, service parameters
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

        // Tests duplicate member handling
        // Verifies: Error response, error status code
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
            role: 'admin' as MemberRole,
            display_name: 'Updated Name'
        };

        // Tests successful member update with valid data
        // Verifies: Service call parameters, response format
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

        // Tests authentication requirement for member updates
        // Verifies: Unauthorized access handling
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

        // Tests handling of updates to non-existent members
        // Verifies: Error status code, error message
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

        // Tests permission checks for member updates
        // Verifies: Access control, error handling
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
        // Tests successful member removal
        // Verifies: Service call parameters, response status
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

        // Tests authentication requirement for member removal
        // Verifies: Unauthorized access handling
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

        // Tests prevention of last admin removal
        // Verifies: Business rule enforcement, error handling
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

        // Tests handling of non-existent member removal
        // Verifies: Error status code, error message
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