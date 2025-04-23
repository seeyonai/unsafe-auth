import { Router } from 'express';
import { verifyJWT, createJWT, customSignOn } from '../controllers/authController';

const router = Router();

// JWT verification endpoint
router.post('/verify', verifyJWT);

// JWT creation endpoint
router.post('/token', createJWT);

// Custom sign-on endpoint
router.post('/custom-sign-on', customSignOn);

export default router; 