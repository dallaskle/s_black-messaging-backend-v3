import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace } from '../../../workspace/services/workspaceService';
import supabase from '../../../config/supabaseClient';
import AppError from '../../../types/AppError';

jest.mock('../../../config/supabaseClient');

// Tests the workspace service's:
// 1. Core workspace operations (CRUD)
// 2. Database interactions with Supabase
// 3. Permission validations
// 4. Error handling for database operations
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
        // Tests successful workspace creation with URL validation
        // Verifies: Database calls, response format, URL uniqueness check
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

        // Tests duplicate workspace URL handling
        // Verifies: URL uniqueness validation, error handling
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

        // Tests database error handling during creation
        // Verifies: Error propagation, error messages
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
        // Tests successful retrieval of user's workspaces
        // Verifies: Database query, response format
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

        // Tests empty workspace list handling
        // Verifies: Empty result handling
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
        // Tests successful workspace retrieval with permissions
        // Verifies: Permission check, database query
        it('should return workspace details', async () => {
            // Mock member check and workspace fetch
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

        // Tests non-existent workspace handling
        // Verifies: Error handling, access control
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

        // Tests unauthorized access handling
        // Verifies: Permission checks, error messages
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

        // Tests successful workspace update with admin permissions
        // Verifies: Admin check, update operation, response format
        it('should update workspace successfully', async () => {
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

        // Tests non-admin update attempt
        // Verifies: Permission validation, error handling
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

        // Tests database error handling during update
        // Verifies: Error propagation, error messages
        it('should handle database errors during update', async () => {
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
                                error: new Error('Database error') 
                            })
                        })
                    })
                })
            });

            await expect(updateWorkspace(
                mockWorkspace.id,
                mockWorkspace.owner_id,
                updateData
            )).rejects.toThrow(new AppError('Failed to update workspace', 500));
        });
    });

    describe('deleteWorkspace', () => {
        // Tests successful workspace deletion by admin
        // Verifies: Admin check, deletion operation
        it('should delete workspace successfully', async () => {
            // Mock admin check and deletion
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

        // Tests non-admin deletion attempt
        // Verifies: Permission validation, error handling
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

        // Tests database errors during deletion
        // Verifies: Error handling, error messages
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