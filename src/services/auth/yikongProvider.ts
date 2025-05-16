import { MD5 } from 'crypto-js';
import { CustomSignOnPayload } from '../../types';
import dotenv from 'dotenv';
import { cache } from '../../controllers/yikongController';

dotenv.config();


/**
 * Verify V5_MD5 authentication method
 * @param payload The payload with empno and token
 * @returns Object with verification result
 */
export function verifyYikong(payload: CustomSignOnPayload): { 
  valid: boolean; 
  userId?: string; 
  error?: string; 
  name?: string; 
  role?: string; 
  email?: string 
} {
  try {
    const { userId, name, email } = payload;
    
    if (!userId || !name || !email) {
      return {
        valid: false,
        error: 'User ID, name, and email are required'
      };
    }
    
    const userInfo = cache.get(userId);
    if (!userInfo) {
      return {
        valid: false,
        error: 'User not found'
      };
    }

    if (userInfo.name !== name || userInfo.email !== email) {
      console.warn('User info mismatch', userInfo, name, email);
      return {
        valid: false,
        error: 'User info mismatch'
      };
    }
    
    return {
      valid: true,
      userId: userId,
      name: name,
      role: 'user',
      email: email,
    };
    

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification'
    };
  }
} 