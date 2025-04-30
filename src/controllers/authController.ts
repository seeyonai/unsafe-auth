import { Request, Response } from 'express';
import { verifyToken, generateToken } from '../services/jwtService';
import { verifyCustomSignOn } from '../services/customSignOnService';
import { VerificationRequest, TokenCreationRequest, CustomSignOnRequest, SignOnMethod } from '../types';

/**
 * Verify JWT token
 * @param req Request with token in body
 * @param res Response with verification result
 */
export function verifyJWT(req: Request, res: Response): void {
  console.log('--- verifyJWT Request Body ---', req.body);
  try {
    const { token } = req.body as VerificationRequest;
    
    if (!token) {
      console.error('verifyJWT Error: Token is required');
      res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
      return;
    }
    
    const verificationResult = verifyToken(token);
    
    if (verificationResult.valid) {
      console.log('verifyJWT Success:', { valid: true, payload: verificationResult.payload });
      res.json({
        valid: true,
        payload: verificationResult.payload
      });
    } else {
      console.error('verifyJWT Error: Token invalid', { error: verificationResult.error });
      res.status(401).json({
        valid: false,
        error: verificationResult.error
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during verification';
    console.error('verifyJWT Exception:', errorMessage, error);
    res.status(500).json({
      valid: false,
      error: errorMessage
    });
  }
}

/**
 * Create JWT token
 * @param req Request with user details
 * @param res Response with generated token
 */
export function createJWT(req: Request, res: Response): void {
  console.log('--- createJWT Request Body ---', req.body);
  try {
    const {payload, headers} = req.body as TokenCreationRequest;
    
    // Generate the token
    const token = generateToken(payload, headers);
    
    // Respond with the token
    console.log('createJWT Success:', { token });
    res.status(201).json({token});
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during token creation';
    console.error('createJWT Exception:', errorMessage, error);
    res.status(500).json({
      error: errorMessage
    });
  }
}

/**
 * Handle custom sign-on verification
 * @param req Request with method and payload
 * @param res Response with verification result and JWT
 */
export function customSignOn(req: Request, res: Response): void {
  console.log('--- customSignOn Request Body ---', req.body);
  try {
    const { method, payload } = req.body as CustomSignOnRequest;
    
    if (!method || !payload) {
      console.error('customSignOn Error: Method and payload are required');
      res.status(400).json({
        valid: false,
        error: 'Method and payload are required'
      });
      return;
    }
    
    // Validate method
    if (!Object.values(SignOnMethod).includes(method as SignOnMethod)) {
      const errorMsg = `Unsupported authentication method: ${method}`;
      console.error('customSignOn Error:', errorMsg);
      res.status(400).json({
        valid: false,
        error: errorMsg
      });
      return;
    }
    
    // Verify the custom sign-on
    const result = verifyCustomSignOn(method as SignOnMethod, payload);
    
    if (result.valid) {
      console.log('customSignOn Success:', { valid: true, token: result.token, expiresAt: result.expiresAt });
      res.status(200).json({
        valid: true,
        token: result.token,
        expiresAt: result.expiresAt
      });
    } else {
      console.error('customSignOn Error: Sign-on failed', { error: result.error });
      res.status(401).json({
        valid: false,
        error: result.error
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during custom sign-on';
    console.error('customSignOn Exception:', errorMessage, error);
    res.status(500).json({
      valid: false,
      error: errorMessage
    });
  }
} 