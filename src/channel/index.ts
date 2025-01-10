import { Router } from 'express';
import generalChannelRoutes from './general/generalChannel.routes';
import channelMemberRoutes from './members/channelMember.routes';
import directMessageRoutes from './directMessage/directMessage.routes';

const router = Router();

router.use('/', generalChannelRoutes);
router.use('/', channelMemberRoutes);
router.use('/', directMessageRoutes);

export default router; 