import { createWorkspaceInvitation, getWorkspaceInvitations, acceptWorkspaceInvitation, revokeWorkspaceInvitation } from '../../../workspace/services/invitationService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';
import { MemberRole } from '../../../types/database';
import { randomBytes } from 'crypto';

jest.mock('../../../config/supabaseClient');
jest.mock('crypto');

// Tests the invitation service's:
// 1. Invitation creation and token generation
// 2. Invitation listing and filtering
// 3. Invitation acceptance with validation
// 4. Invitation revocation and cleanup
describe('invitationService', () => {
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
        // Mock token generation
        (randomBytes as jest.Mock).mockReturnValue({
            toString: jest.fn().mockReturnValue('test-token')
        });
    });

    describe('createWorkspaceInvitation', () => {
        // Tests successful invitation creation with token
        // Verifies: Admin check, token generation, expiration setting
        it('should create invitation successfully', async () => {
            // Mock admin check and invitation creation
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockInvitation })
                    })
                })
            });

            const result = await createWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.created_by,
                mockInvitation.email,
                mockInvitation.role,
                86400000,
                true
            );

            expect(result).toEqual(mockInvitation);
            expect(randomBytes).toHaveBeenCalledWith(32);
        });

        // Tests non-admin invitation creation attempt
        // Verifies: Permission validation, error handling
        it('should handle non-admin invitation attempt', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(createWorkspaceInvitation(
                mockInvitation.workspace_id,
                'non-admin-id',
                mockInvitation.email,
                mockInvitation.role
            )).rejects.toThrow(new AppError('Access denied', 403));
        });

        // Tests database error handling during creation
        // Verifies: Error propagation, error messages
        it('should handle database errors during creation', async () => {
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ 
                            error: new Error('Database error') 
                        })
                    })
                })
            });

            await expect(createWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.created_by,
                mockInvitation.email,
                mockInvitation.role
            )).rejects.toThrow(new AppError('Failed to create invitation', 500));
        });
    });

    describe('getWorkspaceInvitations', () => {
        // Tests successful invitation listing for admin
        // Verifies: Admin check, invitation filtering
        it('should return invitations successfully', async () => {
            // Mock admin check and invitation listing
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [mockInvitation] })
                    })
                })
            });

            const result = await getWorkspaceInvitations(
                mockInvitation.workspace_id,
                mockInvitation.created_by
            );

            expect(result).toEqual([mockInvitation]);
        });

        // Tests unauthorized access to invitations
        // Verifies: Permission validation, error handling
        it('should handle unauthorized access', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(getWorkspaceInvitations(
                mockInvitation.workspace_id,
                'non-admin-id'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });
    });

    describe('acceptWorkspaceInvitation', () => {
        const mockMember = {
            workspace_id: mockInvitation.workspace_id,
            user_id: 'new-member-id',
            role: mockInvitation.role,
            display_name: 'New Member',
            joined_at: new Date().toISOString()
        };

        // Tests successful invitation acceptance
        // Verifies: Token validation, member creation, invitation update
        it('should accept invitation successfully', async () => {
            // Mock invitation check, member creation, and invitation update
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockInvitation })
                        })
                    })
                })
            }).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockMember })
                    })
                })
            }).mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await acceptWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.token,
                mockMember.user_id
            );

            expect(result).toEqual(mockMember);
        });

        // Tests expired invitation handling
        // Verifies: Expiration validation, error handling
        it('should handle expired invitation', async () => {
            const expiredInvitation = {
                ...mockInvitation,
                expires_at: new Date(Date.now() - 1000).toISOString()
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: expiredInvitation })
                        })
                    })
                })
            });

            await expect(acceptWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.token,
                mockMember.user_id
            )).rejects.toThrow(new AppError('Invitation has expired', 400));
        });

        // Tests invalid token handling
        // Verifies: Token validation, error handling
        it('should handle invalid token', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: null })
                        })
                    })
                })
            });

            await expect(acceptWorkspaceInvitation(
                mockInvitation.workspace_id,
                'invalid-token',
                mockMember.user_id
            )).rejects.toThrow(new AppError('Invalid invitation', 400));
        });
    });

    describe('revokeWorkspaceInvitation', () => {
        // Tests successful invitation revocation by admin
        // Verifies: Admin check, invitation deletion
        it('should revoke invitation successfully', async () => {
            // Mock admin check and invitation deletion
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ error: null })
                    })
                })
            });

            await revokeWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.id,
                mockInvitation.created_by
            );

            expect(supabase.from).toHaveBeenCalledWith('workspace_invitations');
        });

        // Tests non-admin revocation attempt
        // Verifies: Permission validation, error handling
        it('should handle non-admin revocation attempt', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(revokeWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.id,
                'non-admin-id'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });

        // Tests database error handling during revocation
        // Verifies: Error propagation, error messages
        it('should handle database errors during revocation', async () => {
            // Mock admin check success but deletion failure
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ 
                            error: new Error('Database error') 
                        })
                    })
                })
            });

            await expect(revokeWorkspaceInvitation(
                mockInvitation.workspace_id,
                mockInvitation.id,
                mockInvitation.created_by
            )).rejects.toThrow(new AppError('Failed to revoke invitation', 500));
        });

        // Tests non-existent invitation handling
        // Verifies: Not found error handling
        it('should handle non-existent invitation', async () => {
            // Mock admin check success but invitation not found
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ 
                            data: null,
                            error: { message: 'Record not found' }
                        })
                    })
                })
            });

            await expect(revokeWorkspaceInvitation(
                mockInvitation.workspace_id,
                'non-existent-id',
                mockInvitation.created_by
            )).rejects.toThrow(new AppError('Invitation not found', 404));
        });
    });
}); 