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

describe('workspaceRoutes', () => {
    let app: express.Application;
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        // Mock authentication middleware
        (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
            req.user = mockUser;
            next();
        });

        // Mock admin middleware
        (isWorkspaceAdmin as jest.Mock).mockImplementation((req, res, next) => {
            next();
        });

        app.use('/workspaces', workspaceRoutes);
    });

    describe('Workspace Management Routes', () => {
        it('POST / should create workspace', async () => {
            const workspaceData = {
                name: 'Test Workspace',
                workspace_url: 'test-workspace'
            };

            (workspaceController.createWorkspace as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ id: 'test-id', ...workspaceData });
            });

            const response = await request(app)
                .post('/workspaces')
                .send(workspaceData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(workspaceController.createWorkspace).toHaveBeenCalled();
        });

        it('GET / should list user workspaces', async () => {
            (workspaceController.getUserWorkspaces as jest.Mock).mockImplementation((req, res) => {
                res.json([{ id: 'test-id', name: 'Test Workspace' }]);
            });

            const response = await request(app)
                .get('/workspaces')
                .expect(200);

            expect(Array.isArray(response.body)).toBeTruthy();
            expect(workspaceController.getUserWorkspaces).toHaveBeenCalled();
        });

        it('GET /:workspaceId should get workspace details', async () => {
            (workspaceController.getWorkspacebyId as jest.Mock).mockImplementation((req, res) => {
                res.json({ id: req.params.workspaceId, name: 'Test Workspace' });
            });

            const response = await request(app)
                .get('/workspaces/test-id')
                .expect(200);

            expect(response.body).toHaveProperty('id', 'test-id');
            expect(workspaceController.getWorkspacebyId).toHaveBeenCalled();
        });

        it('PATCH /:workspaceId should update workspace', async () => {
            const updateData = { name: 'Updated Workspace' };

            (workspaceController.updateWorkspacebyId as jest.Mock).mockImplementation((req, res) => {
                res.json({ id: req.params.workspaceId, ...updateData });
            });

            const response = await request(app)
                .patch('/workspaces/test-id')
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('name', 'Updated Workspace');
            expect(workspaceController.updateWorkspacebyId).toHaveBeenCalled();
        });

        it('DELETE /:workspaceId should delete workspace', async () => {
            (workspaceController.deleteWorkspace as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id')
                .expect(204);

            expect(workspaceController.deleteWorkspace).toHaveBeenCalled();
        });
    });

    describe('Member Management Routes', () => {
        it('GET /:workspaceId/members should list members', async () => {
            (memberController.getWorkspaceMembers as jest.Mock).mockImplementation((req, res) => {
                res.json([{ id: 'member-id', role: 'member' }]);
            });

            const response = await request(app)
                .get('/workspaces/test-id/members')
                .expect(200);

            expect(Array.isArray(response.body)).toBeTruthy();
            expect(memberController.getWorkspaceMembers).toHaveBeenCalled();
        });

        it('POST /:workspaceId/members should add member', async () => {
            const memberData = { userId: 'new-user-id', role: 'member' };

            (memberController.addMember as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({ ...memberData, workspace_id: req.params.workspaceId });
            });

            const response = await request(app)
                .post('/workspaces/test-id/members')
                .send(memberData)
                .expect(201);

            expect(response.body).toHaveProperty('userId', 'new-user-id');
            expect(memberController.addMember).toHaveBeenCalled();
        });

        it('DELETE /:workspaceId/members/:userId should remove member', async () => {
            (memberController.removeMember as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id/members/member-id')
                .expect(204);

            expect(memberController.removeMember).toHaveBeenCalled();
        });
    });

    describe('Invitation Management Routes', () => {
        it('POST /:workspaceId/invitations should create invitation', async () => {
            const invitationData = {
                email: 'invite@example.com',
                role: 'member'
            };

            (invitationController.createInvitation as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json({
                    id: 'invitation-id',
                    ...invitationData,
                    workspace_id: req.params.workspaceId
                });
            });

            const response = await request(app)
                .post('/workspaces/test-id/invitations')
                .send(invitationData)
                .expect(201);

            expect(response.body).toHaveProperty('email', 'invite@example.com');
            expect(invitationController.createInvitation).toHaveBeenCalled();
        });

        it('GET /:workspaceId/invitations should list invitations', async () => {
            (invitationController.getInvitations as jest.Mock).mockImplementation((req, res) => {
                res.json([{ id: 'invitation-id', email: 'invite@example.com' }]);
            });

            const response = await request(app)
                .get('/workspaces/test-id/invitations')
                .expect(200);

            expect(Array.isArray(response.body)).toBeTruthy();
            expect(invitationController.getInvitations).toHaveBeenCalled();
        });

        it('POST /:workspaceId/invitations/accept should accept invitation', async () => {
            const acceptData = { token: 'valid-token' };

            (invitationController.acceptInvitation as jest.Mock).mockImplementation((req, res) => {
                res.json({ workspace_id: req.params.workspaceId, user_id: mockUser.id });
            });

            const response = await request(app)
                .post('/workspaces/test-id/invitations/accept')
                .send(acceptData)
                .expect(200);

            expect(response.body).toHaveProperty('workspace_id', 'test-id');
            expect(invitationController.acceptInvitation).toHaveBeenCalled();
        });

        it('DELETE /:workspaceId/invitations/:invitationId should revoke invitation', async () => {
            (invitationController.revokeInvitation as jest.Mock).mockImplementation((req, res) => {
                res.status(204).send();
            });

            await request(app)
                .delete('/workspaces/test-id/invitations/invitation-id')
                .expect(204);

            expect(invitationController.revokeInvitation).toHaveBeenCalled();
        });
    });

    describe('Middleware Tests', () => {
        it('should require authentication for all routes', async () => {
            (authenticateToken as jest.Mock).mockImplementationOnce((req, res, next) => {
                res.status(401).json({ message: 'Authentication required' });
            });

            await request(app)
                .get('/workspaces')
                .expect(401);

            expect(authenticateToken).toHaveBeenCalled();
        });

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