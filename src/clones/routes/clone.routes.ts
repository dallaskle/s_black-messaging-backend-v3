import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CloneController } from '../controllers/clone.controller';
import { authenticateToken } from '../../middleware/authMiddleWare/authenticateToken';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const cloneController = new CloneController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Clone management routes
router.post('/clones', async (req: Request, res: Response) => {
    await cloneController.createClone(req, res);
});
router.get('/clones', async (req: Request, res: Response) => {
    await cloneController.listClones(req, res);
});
router.get('/clones/:id', async (req: Request, res: Response) => {
    await cloneController.getClone(req, res);
});
router.put('/clones/:id', async (req: Request, res: Response) => {
    await cloneController.updateClone(req, res);
});
router.delete('/clones/:id', async (req: Request, res: Response) => {
    await cloneController.deleteClone(req, res);
});

// Document upload route (Python service integration)
router.post('/clones/:clone_id/documents', 
    upload.single('file'),
    async (req: Request, res: Response) => {
        await cloneController.uploadDocument(req, res);
    }
);

// Chat route (Python service integration)
router.post('/clones/:clone_id/chat', 
    async (req: Request, res: Response) => {
        await cloneController.chat(req, res);
    }
);

// Health check route (Python service health)
router.get('/clones/health', 
    async (req: Request, res: Response) => {
        await cloneController.checkHealth(req, res);
    }
);

export default router; 