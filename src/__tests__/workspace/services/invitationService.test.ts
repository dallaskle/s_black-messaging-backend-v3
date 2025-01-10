import { createWorkspaceInvitation, getWorkspaceInvitations, acceptWorkspaceInvitation, revokeWorkspaceInvitation } from '../../../workspace/services/invitationService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';
import { MemberRole } from '../../../types/database';
import { randomBytes } from 'crypto';

jest.mock('../../../config/supabaseClient');
jest.mock('crypto');

describe('invitationService', () => {
    const mockInvitation = {
        id: 'test-invitation-id',
        workspace_id: 'test-workspace-id',
        email: 'test@example.com',
        token: 'test-token',
        role: 'member' as MemberRole,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        single_use: true,
        created_by: 'admin-id',
        created_at: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (randomBytes as jest.Mock).mockReturnValue({
            toString: jest.fn().mockReturnValue('test-token')
        });
    });

    describe('createWorkspaceInvitation', () => {
        it('should create invitation successfully', async () => {
            // Mock admin check
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
    });

    describe('getWorkspaceInvitations', () => {
        it('should return invitations successfully', async () => {
            // Mock admin check
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

        it('should accept invitation successfully', async () => {
            // Mock invitation check
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
        it('should revoke invitation successfully', async () => {
            // Mock admin check
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

        it('should handle unauthorized revocation', async () => {
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
    });
}); 