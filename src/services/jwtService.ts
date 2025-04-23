import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// This would typically be stored securely in environment variables
const JWT_SECRET = 'your-secret-key';

/**
 * Verify a custom format JWT token
 * @param token The JWT token to verify
 * @returns An object with verification result
 */
export function verifyToken(token: string): { valid: boolean; payload?: JWTPayload; error?: string } {
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    return {
      valid: true,
      payload: decodedToken
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during token verification'
    };
  }
}

/**
 * Generate a new JWT token
 * @param payload The payload to encode in the token
 * @param header Additional header fields to include
 * @returns The generated token
 */
export function generateToken(
  payload: JWTPayload, 
  header?: Record<string, any>
): string {
  // Add standard JWT fields if not provided
  const tokenPayload = {
    ...payload,
    iat: payload.iat || Math.floor(Date.now() / 1000),
    exp: payload.exp || Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
  };
  
  // Sign with optional header
  const options = header ? { header: { ...header, typ: 'JWT', alg: 'HS256' } } : undefined;
  const token = jwt.sign(tokenPayload, JWT_SECRET, options);
  
  return token;
}
