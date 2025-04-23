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
  console.log('verifyJWT', req.body);
  try {
    const { token } = req.body as VerificationRequest;
    
    if (!token) {
      res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
      return;
    }
    
    const verificationResult = verifyToken(token);
    
    if (verificationResult.valid) {
      res.json({
        valid: true,
        payload: verificationResult.payload
      });
    } else {
      res.status(401).json({
        valid: false,
        error: verificationResult.error
      });
    }
  } catch (error) {
    res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification'
    });
  }
}

/**
 * Create JWT token
 * @param req Request with user details
 * @param res Response with generated token
 */
export function createJWT(req: Request, res: Response): void {
  console.log('createJWT', req.body);
  try {
    const {payload, headers} = req.body as TokenCreationRequest;
    
    // Generate the token
    const token = generateToken(payload, headers);
    
    // Respond with the token
    res.status(201).json({token});
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error during token creation'
    });
  }
}

/**
 * Handle custom sign-on verification
 * @param req Request with method and payload
 * @param res Response with verification result and JWT
 */
export function customSignOn(req: Request, res: Response): void {
  console.log('customSignOn', req.body);
  try {
    const { method, payload } = req.body as CustomSignOnRequest;
    
    if (!method || !payload) {
      res.status(400).json({
        valid: false,
        error: 'Method and payload are required'
      });
      return;
    }
    
    // Validate method
    if (!Object.values(SignOnMethod).includes(method as SignOnMethod)) {
      res.status(400).json({
        valid: false,
        error: `Unsupported authentication method: ${method}`
      });
      return;
    }
    
    // Verify the custom sign-on
    const result = verifyCustomSignOn(method as SignOnMethod, payload);
    
    if (result.valid) {
      res.status(200).json({
        valid: true,
        token: result.token,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(401).json({
        valid: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during custom sign-on'
    });
  }
} 