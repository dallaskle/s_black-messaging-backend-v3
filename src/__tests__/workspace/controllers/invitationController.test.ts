import { createInvitation, getInvitations, acceptInvitation, revokeInvitation } from '../../../workspace/controllers/invitationController';
import * as invitationService from '../../../workspace/services/invitationService';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import AppError from '../../../types/AppError';
import { MemberRole } from '../../../types/database';

jest.mock('../../../workspace/services/invitationService');

// Tests the invitation controller's:
// 1. Invitation creation with expiration and role settings
// 2. Invitation listing with admin permissions
// 3. Invitation acceptance with token validation
// 4. Invitation revocation with admin rights
describe('invitationController', () => {
    const mockInvitation = {
        id: 'test-invitation-id',
        workspace_id: 'test-workspace-id',
        email: 'test@example.com',
        token: 'test-token',
        role: 'member' as MemberRole,
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        single_use: true,
        created_by: 'admin-id',
        created_at: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createInvitation', () => {
        const createInvitationData = {
            email: 'test@example.com',
            role: 'member' as MemberRole,
            expiresIn: 86400000,
            singleUse: true
        };

        // Tests successful invitation creation with all parameters
        // Verifies: Status code, response format, service parameters
        it('should create invitation successfully', async () => {
            const mockRequest = createMockRequest(
                createInvitationData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            (invitationService.createWorkspaceInvitation as jest.Mock).mockResolvedValue(mockInvitation);

            await createInvitation(mockRequest as any, mockResponse as any);

            expect(invitationService.createWorkspaceInvitation).toHaveBeenCalledWith(
                'test-workspace-id',
                'admin-id',
                createInvitationData.email,
                createInvitationData.role,
                createInvitationData.expiresIn,
                createInvitationData.singleUse
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockInvitation);
        });

        // Tests authentication requirement for invitation creation
        // Verifies: Unauthorized access handling
        it('should handle unauthorized invitation creation', async () => {
            const mockRequest = createMockRequest(
                createInvitationData,
                { workspaceId: 'test-workspace-id' }
            );
            const mockResponse = createMockResponse();

            await createInvitation(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        // Tests admin permission requirement for invitation creation
        // Verifies: Permission checks, error handling
        it('should handle insufficient permissions', async () => {
            const mockRequest = createMockRequest(
                createInvitationData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'non-admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Access denied', 403);
            (invitationService.createWorkspaceInvitation as jest.Mock).mockRejectedValue(error);

            await createInvitation(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Access denied'
            });
        });
    });

    describe('getInvitations', () => {
        // Tests successful retrieval of workspace invitations
        // Verifies: Response format, service call parameters
        it('should return invitations successfully', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            (invitationService.getWorkspaceInvitations as jest.Mock).mockResolvedValue([mockInvitation]);

            await getInvitations(mockRequest as any, mockResponse as any);

            expect(invitationService.getWorkspaceInvitations).toHaveBeenCalledWith(
                'test-workspace-id',
                'admin-id'
            );
            expect(mockResponse.json).toHaveBeenCalledWith([mockInvitation]);
        });

        // Tests authentication requirement for invitation listing
        // Verifies: Unauthorized access handling
        it('should handle unauthorized access', async () => {
            const mockRequest = createMockRequest(
                {},
                { workspaceId: 'test-workspace-id' }
            );
            const mockResponse = createMockResponse();

            await getInvitations(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });
    });

    describe('acceptInvitation', () => {
        const acceptData = {
            token: 'valid-token'
        };

        // Tests successful invitation acceptance
        // Verifies: Response format, service call parameters
        it('should accept invitation successfully', async () => {
            const mockRequest = createMockRequest(
                acceptData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'new-member-id' } }
            );
            const mockResponse = createMockResponse();

            const mockMember = {
                workspace_id: 'test-workspace-id',
                user_id: 'new-member-id',
                role: 'member' as MemberRole,
                joined_at: new Date().toISOString()
            };

            (invitationService.acceptWorkspaceInvitation as jest.Mock).mockResolvedValue(mockMember);

            await acceptInvitation(mockRequest as any, mockResponse as any);

            expect(invitationService.acceptWorkspaceInvitation).toHaveBeenCalledWith(
                'test-workspace-id',
                'valid-token',
                'new-member-id'
            );
            expect(mockResponse.json).toHaveBeenCalledWith(mockMember);
        });

        // Tests expired invitation handling
        // Verifies: Error status code, error message
        it('should handle expired invitation', async () => {
            const mockRequest = createMockRequest(
                acceptData,
                { workspaceId: 'test-workspace-id' },
                { user: { id: 'new-member-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Invitation has expired', 400);
            (invitationService.acceptWorkspaceInvitation as jest.Mock).mockRejectedValue(error);

            await acceptInvitation(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invitation has expired'
            });
        });
    });

    describe('revokeInvitation', () => {
        // Tests successful invitation revocation
        // Verifies: Service call parameters, response status
        it('should revoke invitation successfully', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    invitationId: 'test-invitation-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            (invitationService.revokeWorkspaceInvitation as jest.Mock).mockResolvedValue(undefined);

            await revokeInvitation(mockRequest as any, mockResponse as any);

            expect(invitationService.revokeWorkspaceInvitation).toHaveBeenCalledWith(
                'test-workspace-id',
                'test-invitation-id',
                'admin-id'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        // Tests authentication requirement for invitation revocation
        // Verifies: Unauthorized access handling
        it('should handle unauthorized revocation', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    invitationId: 'test-invitation-id'
                }
            );
            const mockResponse = createMockResponse();

            await revokeInvitation(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Authentication required'
            });
        });

        // Tests handling of non-existent invitation revocation
        // Verifies: Error status code, error message
        it('should handle non-existent invitation', async () => {
            const mockRequest = createMockRequest(
                {},
                { 
                    workspaceId: 'test-workspace-id',
                    invitationId: 'non-existent-id'
                },
                { user: { id: 'admin-id' } }
            );
            const mockResponse = createMockResponse();

            const error = new AppError('Invitation not found', 404);
            (invitationService.revokeWorkspaceInvitation as jest.Mock).mockRejectedValue(error);

            await revokeInvitation(mockRequest as any, mockResponse as any);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Invitation not found'
            });
        });
    });
}); 