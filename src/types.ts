// JWT Payload type
export interface JWTPayload {
  iat?: number;
  exp?: number;
  [key: string]: any;
}

// Verification request type
export interface VerificationRequest {
  token: string;
}

// Verification response type
export interface VerificationResponse {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

// Token creation request type
export interface TokenCreationRequest {
  payload: JWTPayload;
  headers?: Record<string, any>;
}

// Token creation response type
export interface TokenCreationResponse {
  token: string;
  expiresAt: number;
}

// Custom sign-on method
export enum SignOnMethod {
  V5_MD5 = 'V5_MD5',
  YIKONG = 'YIKONG',
}

// Custom sign-on payload
export interface CustomSignOnPayload {
  empno: string;
  t_time: string;  // Timestamp field
  token: string;
  role?: string;
  userId?: string;
  email?: string;
  [key: string]: any; // Allow additional fields
}

// Custom sign-on request
export interface CustomSignOnRequest {
  method: SignOnMethod;
  payload: CustomSignOnPayload;
}
