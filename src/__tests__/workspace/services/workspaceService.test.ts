import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace } from '../../../workspace/services/workspaceService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';

jest.mock('../../../config/supabaseClient');

describe('workspaceService', () => {
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
        it('should create a workspace successfully', async () => {
            // Mock workspace URL check
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null })
                    })
                }),
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockWorkspace })
                    })
                })
            });

            const result = await createWorkspace(
                mockWorkspace.name,
                mockWorkspace.owner_id,
                mockWorkspace.workspace_url
            );

            expect(result).toEqual(mockWorkspace);
            expect(supabase.from).toHaveBeenCalledWith('workspaces');
        });

        it('should handle duplicate workspace URL', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'existing-id' } })
                    })
                })
            });

            await expect(createWorkspace(
                mockWorkspace.name,
                mockWorkspace.owner_id,
                mockWorkspace.workspace_url
            )).rejects.toThrow(new AppError('Workspace URL already exists', 400));
        });

        it('should handle database errors', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ 
                            error: new Error('Database error') 
                        })
                    })
                })
            });

            await expect(createWorkspace(
                mockWorkspace.name,
                mockWorkspace.owner_id,
                mockWorkspace.workspace_url
            )).rejects.toThrow(new AppError('Failed to check workspace URL availability', 500));
        });
    });

    describe('getUserWorkspaces', () => {
        it('should return user workspaces', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockWorkspace] })
                    })
                })
            });

            const result = await getUserWorkspaces(mockWorkspace.owner_id);

            expect(result).toEqual([mockWorkspace]);
            expect(supabase.from).toHaveBeenCalledWith('workspace_members');
        });

        it('should handle no workspaces found', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [] })
                    })
                })
            });

            const result = await getUserWorkspaces(mockWorkspace.owner_id);

            expect(result).toEqual([]);
        });
    });

    describe('getWorkspaceById', () => {
        it('should return workspace details', async () => {
            // Mock member check
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
                        single: jest.fn().mockResolvedValue({ data: mockWorkspace })
                    })
                })
            });

            const result = await getWorkspaceById(
                mockWorkspace.id,
                mockWorkspace.owner_id
            );

            expect(result).toEqual(mockWorkspace);
        });

        it('should handle non-existent workspace', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null })
                    })
                })
            });

            await expect(getWorkspaceById(
                'non-existent-id',
                mockWorkspace.owner_id
            )).rejects.toThrow(new AppError('Access denied', 403));
        });

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

            await expect(getWorkspaceById(
                mockWorkspace.id,
                'unauthorized-user'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });
    });

    describe('updateWorkspace', () => {
        const updateData = {
            name: 'Updated Workspace',
            workspace_url: 'updated-workspace'
        };

        it('should update workspace successfully', async () => {
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
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ 
                                data: { ...mockWorkspace, ...updateData }
                            })
                        })
                    })
                })
            });

            const result = await updateWorkspace(
                mockWorkspace.id,
                mockWorkspace.owner_id,
                updateData
            );

            expect(result).toEqual({ ...mockWorkspace, ...updateData });
        });

        it('should handle non-admin update attempt', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(updateWorkspace(
                mockWorkspace.id,
                'non-admin-user',
                updateData
            )).rejects.toThrow(new AppError('Access denied', 403));
        });
    });

    describe('deleteWorkspace', () => {
        it('should delete workspace successfully', async () => {
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
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            await deleteWorkspace(mockWorkspace.id, mockWorkspace.owner_id);

            expect(supabase.from).toHaveBeenCalledWith('workspaces');
        });

        it('should handle non-admin deletion attempt', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { role: 'member' } })
                        })
                    })
                })
            });

            await expect(deleteWorkspace(
                mockWorkspace.id,
                'non-admin-user'
            )).rejects.toThrow(new AppError('Access denied', 403));
        });

        it('should handle database errors during deletion', async () => {
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
                    eq: jest.fn().mockResolvedValue({ 
                        error: new Error('Database error') 
                    })
                })
            });

            await expect(deleteWorkspace(
                mockWorkspace.id,
                mockWorkspace.owner_id
            )).rejects.toThrow(new AppError('Failed to delete workspace', 500));
        });
    });
}); 