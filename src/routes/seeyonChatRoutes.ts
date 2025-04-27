import { RequestHandler, Router } from 'express';
import { seeyonChat, seeyonChatCallback } from '../controllers/seeyonChatController';

const router = Router();

// Seeyon Chat OAuth endpoints
router.get('/seeyon-chat', seeyonChat as RequestHandler);
router.get('/seeyon-chat/callback', seeyonChatCallback as RequestHandler);

export default router;
