import { RequestHandler, Router } from 'express';
import { yikongAuth, yikongCallback } from '../controllers/yikongController';

const router = Router();

// GitHub OAuth endpoints
router.get('/yikong', yikongAuth as RequestHandler);
router.get('/yikong/callback', yikongCallback as RequestHandler);

export default router;
