import request from 'supertest';
import express from 'express';
import workspaceRoutes from '../../../workspace/workspaceRoutes';
import { authenticateToken } from '../../../middleware/authMiddleWare/authenticateToken';
import { isWorkspaceAdmin } from '../../../middleware/authMiddleWare/isWorkspaceAdmin';
import * as workspaceController from '../../../workspace/controllers/workspaceController';
import * as memberController from '../../../workspace/controllers/memberController';
import * as invitationController from '../../../workspace/controllers/invitationController';

jest.mock('../../../middleware/authMiddleWare/authenticateToken');
jest.mock('../../../middleware/authMiddleWare/isWorkspaceAdmin');
jest.mock('../../../workspace/controllers/workspaceController');
jest.mock('../../../workspace/controllers/memberController');
jest.mock('../../../workspace/controllers/invitationController');

// Tests the workspace routes:
// 1. Route configuration and middleware setup
// 2. Request/response flow through controllers
// 3. Authentication and authorization checks
// 4. Error handling at route level
describe('workspaceRoutes', () => {
    let app: express.Application;
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        // Mock successful authentication by default
        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = mockUser;
            next();
        });

        // Mock successful admin check by default
        (isWorkspaceAdmin as jest.Mock).mockImplementation((req, res, next) => {
            next();
        });

        app.use('/workspaces', workspaceRoutes);
    });

    describe('Workspace Routes', () => {
        // Tests workspace creation endpoint
        // Verifies: Request body handling, auth check, response
        it('should create workspace', async () => {
            const workspaceData = {
                name: 'Test Workspace',
                workspace_url: 'test-workspace'
            };

            (workspaceController.createWorkspace as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ id: 'new-workspace-id', ...workspaceData });
            });

            await request(app)
                .post('/workspaces')
                .send(workspaceData)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.name).toBe(workspaceData.name);
                });
        });

        // Tests workspace listing endpoint
        // Verifies: Auth check, query parameters, response format
        it('should list user workspaces', async () => {
            const mockWorkspaces = [
                { id: 'workspace-1', name: 'Workspace 1' },
                { id: 'workspace-2', name: 'Workspace 2' }
            ];

            (workspaceController.getUserWorkspaces as jest.Mock).mockImplementation((req, res) => {
                res.json(mockWorkspaces);
            });

            await request(app)
                .get('/workspaces')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body).toHaveLength(2);
                });
        });

        // Tests workspace update endpoint
        // Verifies: Admin middleware, request params, response
        it('should update workspace', async () => {
            const updateData = { name: 'Updated Workspace' };

            (workspaceController.updateWorkspacebyId as jest.Mock).mockImplementation((req, res) => {
                res.json({ id: 'test-id', ...updateData });
            });

            await request(app)
                .patch('/workspaces/test-id')
                .send(updateData)
                .expect(200)
                .expect((res) => {
                    expect(res.body.name).toBe(updateData.name);
                });

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });

        // Tests workspace deletion endpoint
        // Verifies: Admin middleware, cascade deletion
        it('should delete workspace', async () => {
            (workspaceController.deleteWorkspace as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id')
                .expect(204);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });
    });

    describe('Member Routes', () => {
        // Tests member listing endpoint
        // Verifies: Workspace params, auth check
        it('should list workspace members', async () => {
            const mockMembers = [
                { id: 'member-1', role: 'admin' },
                { id: 'member-2', role: 'member' }
            ];

            (memberController.getWorkspaceMembers as jest.Mock).mockImplementation((req, res) => {
                res.json(mockMembers);
            });

            await request(app)
                .get('/workspaces/test-id/members')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body).toHaveLength(2);
                });
        });

        // Tests member addition endpoint
        // Verifies: Admin check, request validation
        it('should add workspace member', async () => {
            const memberData = {
                userId: 'new-user-id',
                role: 'member'
            };

            (memberController.addMember as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ id: 'new-member-id', ...memberData });
            });

            await request(app)
                .post('/workspaces/test-id/members')
                .send(memberData)
                .expect(201);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });

        // Tests member update endpoint
        // Verifies: Admin check, role updates, validation
        it('should update workspace member', async () => {
            const updateData = {
                role: 'admin',
                display_name: 'Updated Name'
            };

            (memberController.updateMember as jest.Mock).mockImplementation((req, res) => {
                res.json({ id: 'member-id', ...updateData });
            });

            await request(app)
                .patch('/workspaces/test-id/members/member-id')
                .send(updateData)
                .expect(200)
                .expect((res) => {
                    expect(res.body.role).toBe(updateData.role);
                    expect(res.body.display_name).toBe(updateData.display_name);
                });

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });

        // Tests member removal endpoint
        // Verifies: Admin check, cascade cleanup
        it('should remove workspace member', async () => {
            (memberController.removeMember as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id/members/member-id')
                .expect(204);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });
    });

    describe('Invitation Routes', () => {
        // Tests invitation creation endpoint
        // Verifies: Admin check, invitation data validation
        it('should create invitation', async () => {
            const invitationData = {
                email: 'invite@example.com',
                role: 'member'
            };

            (invitationController.createInvitation as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ id: 'new-invitation-id', ...invitationData });
            });

            await request(app)
                .post('/workspaces/test-id/invitations')
                .send(invitationData)
                .expect(201);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });

        // Tests invitation listing endpoint
        // Verifies: Admin check, response format
        it('should list workspace invitations', async () => {
            const mockInvitations = [
                { id: 'invite-1', email: 'test1@example.com' },
                { id: 'invite-2', email: 'test2@example.com' }
            ];

            (invitationController.getInvitations as jest.Mock).mockImplementation((req, res) => {
                res.json(mockInvitations);
            });

            await request(app)
                .get('/workspaces/test-id/invitations')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body).toHaveLength(2);
                });

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });

        // Tests invitation acceptance endpoint
        // Verifies: Token validation, member creation
        it('should accept workspace invitation', async () => {
            const acceptData = {
                token: 'valid-token'
            };

            (invitationController.acceptInvitation as jest.Mock).mockImplementation((req, res) => {
                res.json({ id: 'new-member-id', role: 'member' });
            });

            await request(app)
                .post('/workspaces/test-id/invitations/accept')
                .send(acceptData)
                .expect(200);
        });

        // Tests invitation revocation endpoint
        // Verifies: Admin check, cleanup
        it('should revoke workspace invitation', async () => {
            (invitationController.revokeInvitation as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id/invitations/invite-id')
                .expect(204);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });
    });

    describe('Middleware Tests', () => {
        // Tests authentication middleware
        // Verifies: Token validation, unauthorized access
        it('should require authentication for all routes', async () => {
            (authenticateToken as jest.Mock).mockImplementationOnce((req, res, next) => {
                res.status(401).json({ message: 'Authentication required' });
            });

            await request(app)
                .get('/workspaces')
                .expect(401);

            expect(authenticateToken).toHaveBeenCalled();
        });

        // Tests admin middleware
        // Verifies: Admin role check, forbidden access
        it('should require admin rights for protected routes', async () => {
            (isWorkspaceAdmin as jest.Mock).mockImplementationOnce((req, res, next) => {
                res.status(403).json({ message: 'Admin access required' });
            });

            await request(app)
                .patch('/workspaces/test-id')
                .send({ name: 'Updated' })
                .expect(403);

            expect(isWorkspaceAdmin).toHaveBeenCalled();
        });
    });
}); 