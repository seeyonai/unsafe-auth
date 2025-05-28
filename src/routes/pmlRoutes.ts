import { RequestHandler, Router } from 'express';
import { pml, pmlCallback, pmlResource } from '../controllers/pmlController';

const router = Router();

// Seeyon Chat OAuth endpoints
router.get('/pml', pml as RequestHandler);
router.get('/pml/callback', pmlCallback as RequestHandler);
router.get('/pml/resource', pmlResource as RequestHandler);

export default router;
