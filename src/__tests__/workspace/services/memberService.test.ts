import { getWorkspaceMembers, addWorkspaceMember, updateWorkspaceMember, removeWorkspaceMember } from '../../../workspace/services/memberService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';
import { MemberRole } from '../../../types/database';

jest.mock('../../../config/supabaseClient');

// Tests the member service's:
// 1. Member management operations (CRUD)
// 2. Role-based access control
// 3. Database interactions with Supabase
// 4. Business rule enforcement (e.g., last admin protection)
describe('memberService', () => {
    const mockMember = {
        workspace_id: 'test-workspace-id',
        user_id: 'test-user-id',
        role: 'member' as MemberRole,
        display_name: 'Test User',
        joined_at: new Date().toISOString()
    };

    const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWorkspaceMembers', () => {
        // Tests successful retrieval of workspace members
        // Verifies: Permission check, member list format
        it('should return workspace members successfully', async () => {
            // Mock membership check and member list retrieval
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ 
                            data: [{ ...mockMember, user: mockUser }] 
                        })
                    })
                })
            });

            const result = await getWorkspaceMembers(
                mockMember.workspace_id,
                mockMember.user_id
            );

            expect(result).toEqual([{ ...mockMember, user: mockUser }]);
        });

        // Tests unauthorized access to member list
        // Verifies: Access control, error handling
        it('should handle unauthorized access', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: null })
                        })
                    })
                })
            });

            await expect(getWorkspaceMembers(
                mockMember.workspace_id,
                'unauthorized-user'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });
    });

    describe('addWorkspaceMember', () => {
        // Tests successful member addition by admin
        // Verifies: Admin check, user lookup, member creation
        it('should add member successfully', async () => {
            // Mock admin check, user lookup, and member addition
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
                        single: jest.fn().mockResolvedValue({ data: mockUser })
                    })
                })
            }).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null })
                    })
                })
            }).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockMember })
                    })
                })
            });

            const result = await addWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id,
                'member'
            );

            expect(result).toEqual(mockMember);
        });

        // Tests non-admin member addition attempt
        // Verifies: Permission validation, error handling
        it('should handle non-admin add attempt', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(addWorkspaceMember(
                mockMember.workspace_id,
                'non-admin-user',
                mockMember.user_id,
                'member'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });

        // Tests duplicate member handling
        // Verifies: Uniqueness check, error handling
        it('should handle duplicate member', async () => {
            // Mock admin check success but member already exists
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
                        single: jest.fn().mockResolvedValue({ data: mockUser })
                    })
                })
            }).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockMember })
                    })
                })
            });

            await expect(addWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id,
                'member'
            )).rejects.toThrow(new AppError('User is already a member', 400));
        });
    });

    describe('updateWorkspaceMember', () => {
        const updateData = {
            role: 'admin' as MemberRole,
            display_name: 'Updated Name'
        };

        // Tests successful member update by admin
        // Verifies: Admin check, update operation, response format
        it('should update member successfully', async () => {
            // Mock admin check and update operation
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ 
                                    data: { ...mockMember, ...updateData }
                                })
                            })
                        })
                    })
                })
            });

            const result = await updateWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id,
                updateData
            );

            expect(result).toEqual({ ...mockMember, ...updateData });
        });

        // Tests prevention of last admin role change
        // Verifies: Business rule enforcement, error handling
        it('should prevent last admin role change', async () => {
            // Mock admin check and last admin check
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
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [{ role: 'admin' }] })
                        })
                    })
                })
            });

            await expect(updateWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                'admin-id',
                { role: 'member' as MemberRole }
            )).rejects.toThrow(new AppError('Cannot change role of the last admin', 400));
        });

        // Tests database error handling during update
        // Verifies: Error propagation, error messages
        it('should handle database errors during update', async () => {
            // Mock admin check success but update failure
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'admin' } })
                        })
                    })
                })
            }).mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ 
                                    error: new Error('Database error') 
                                })
                            })
                        })
                    })
                })
            });

            await expect(updateWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id,
                updateData
            )).rejects.toThrow(new AppError('Failed to update member', 500));
        });
    });

    describe('removeWorkspaceMember', () => {
        // Tests successful member removal by admin
        // Verifies: Admin check, removal operation
        it('should remove member successfully', async () => {
            // Mock admin check and member removal
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

            await removeWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id
            );

            expect(supabase.from).toHaveBeenCalledWith('workspace_members');
        });

        // Tests prevention of last admin removal
        // Verifies: Business rule enforcement, error handling
        it('should prevent last admin removal', async () => {
            // Mock admin check and last admin check
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
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [{ role: 'admin' }] })
                        })
                    })
                })
            });

            await expect(removeWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                'admin-id'
            )).rejects.toThrow(new AppError('Cannot remove the last admin', 400));
        });

        // Tests database error handling during removal
        // Verifies: Error propagation, error messages
        it('should handle database errors during removal', async () => {
            // Mock admin check success but removal failure
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

            await expect(removeWorkspaceMember(
                mockMember.workspace_id,
                'admin-id',
                mockMember.user_id
            )).rejects.toThrow(new AppError('Failed to remove member', 500));
        });
    });
}); 