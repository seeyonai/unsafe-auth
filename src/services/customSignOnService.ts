import { SignOnMethod, CustomSignOnPayload } from '../types';
import { generateToken } from './jwtService';
import { verifyV5Md5 } from './auth/v5MdProvider';

/**
 * Verify custom sign-on request
 * @param method The authentication method
 * @param payload The authentication payload
 * @returns Object with verification result and generated JWT if valid
 */
export function verifyCustomSignOn(method: SignOnMethod, payload: CustomSignOnPayload): {
  valid: boolean;
  token?: string;
  expiresAt?: number;
  error?: string;
} {
  try {
    let verificationResult;
    
    // Verify based on method
    switch (method) {
      case SignOnMethod.V5_MD5:
        verificationResult = verifyV5Md5(payload);
        break;
      
      default:
        return {
          valid: false,
          error: `Unsupported authentication method: ${method}`
        };
    }
    
    // If verification successful, generate a JWT
    if (verificationResult.valid && verificationResult.userId) {
      const expiresIn = 60 * 60 * 24 * 30; // 30 days
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
      
      // Use userId or empNo as user ID
      const userId = payload.userId || verificationResult.userId;
      
      // Get name from payload or default
      const name = payload.name || verificationResult.name;
      
      // Get role from payload or default
      const role = payload.role || verificationResult.role;
      
      // Get email or generate default
      const email = payload.email || verificationResult.email;
      
      // Create JWT with auth method in header
      const token = generateToken(
        {
          user: {
            id: userId,
            role,
            name,
            email
          },
          exp: expiresAt
        },
        { auth_method: method } // Include auth method in header
      );
      
      return {
        valid: true,
        token,
        expiresAt
      };
    }
    
    return verificationResult;
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during sign-on'
    };
  }
} 