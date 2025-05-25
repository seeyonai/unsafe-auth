import { RequestHandler, Router } from 'express';
import { githubAuth, githubCallback, githubResource } from '../controllers/githubController';

const router = Router();

// GitHub OAuth endpoints
router.get('/github', githubAuth as RequestHandler);
router.get('/github/callback', githubCallback as RequestHandler);
router.get('/github/resource', githubResource as RequestHandler);

export default router;
