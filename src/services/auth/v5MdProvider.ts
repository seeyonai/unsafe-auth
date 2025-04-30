import { MD5 } from 'crypto-js';
import { CustomSignOnPayload } from '../../types';
import dotenv from 'dotenv';

dotenv.config();

// Fallback preshared key for development - should use environment variable in production
const V5_MD5_PRESHARED_KEY = process.env.V5_MD5_PRESHARED_KEY || 'dev-preshared-key';

if (!V5_MD5_PRESHARED_KEY) {
  console.error('V5_MD5_PRESHARED_KEY is not defined in the environment variables');
  process.exit(1);
}

/**
 * Verify V5_MD5 authentication method
 * @param payload The payload with empno and token
 * @returns Object with verification result
 */
export function verifyV5Md5(payload: CustomSignOnPayload): { 
  valid: boolean; 
  userId?: string; 
  error?: string; 
  name?: string; 
  role?: string; 
  email?: string 
} {
  try {
    const { empno, t_time, token } = payload;
    
    if (!empno || !t_time || !token) {
      return {
        valid: false,
        error: 'Employee number, timestamp, and token are required'
      };
    }
    
    // Check if t_time is within the last 10 minutes
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - (10 * 60);
    const timeParsed = parseInt(t_time, 10);
    if (isNaN(timeParsed)) {
      return {
        valid: false,
        error: 'Invalid timestamp format'
      };
    }
    if (timeParsed < tenMinutesAgo || timeParsed > Date.now() / 1000) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Token timestamp is too old or in the future', timeParsed, tenMinutesAgo, Date.now() / 1000);
      } else {
        return {
          valid: false,
          error: 'Token timestamp is too old or in the future'
        };
      }
    }

    // Generate expected MD5 hash
    const expectedHash = MD5(empno + V5_MD5_PRESHARED_KEY + t_time).toString();
    
    // Compare with provided token
    if (token.toLowerCase() === expectedHash.toLowerCase()) {
      // Collect all user info from payload
      const userInfo: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(payload)) {
        if (key !== 'empno' && key !== 't_time' && key !== 'token') {
          userInfo[key] = value;
        }
      }
      
      return {
        valid: true,
        userId: empno,
        name: empno,
        role: 'user',
        email: `${empno}@example.com`,
      };
    }
    
    return {
      valid: false,
      error: 'Invalid token'
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification'
    };
  }
} 