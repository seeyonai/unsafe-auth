# Unsafe Auth API

A minimal Express server with JWT verification endpoints for custom format tokens.

## Features
- Express server with TypeScript
- Custom JWT verification endpoint
- Strict type checking
- CORS enabled

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Development

```bash
# Run in development mode with hot reload
npm run dev
```

### Production

```bash
# Build for production
npm run build

# Run in production
npm start
```

## API Endpoints

### Verify JWT token
```
POST /api/auth/verify
```

**Request Body:**
```json
{
  "token": "your-jwt-token-here"
}
```

**Response:**
```json
{
  "valid": true,
  "payload": {
    "user": {
      "id": "123",
      "role": "admin"
    },
    "iat": 1618824000,
    "exp": 1618910400
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "jwt expired"
}
```

### Create JWT token
```
POST /api/auth/token
```

**Request Body:**
```json
{
  "userId": "123",
  "role": "admin",
  "expiresIn": 3600,
  "useCustomFormat": false,
  "additionalData": {
    "email": "user@example.com"
  }
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1618910400
}
```

**Error Response:**
```json
{
  "error": "User ID and role are required"
}
```

### Custom Sign-On
```
POST /api/auth/custom-sign-on
```

**Request Body:**
```json
{
  "method": "V5_MD5",
  "payload": {
    "empno": "12345",
    "t_time": "1656789012",
    "token": "md5-hash-of-empno-preshared-key-and-timestamp",
    "role": "employee",
    "email": "employee@company.com",
    "avatar": "https://example.com/avatar.jpg",
    "department": "Engineering"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1618910400
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invalid token"
}
```

**JWT Format:**
- The authentication method used is included in the JWT header as `auth_method`
- Default expiration is 30 days

#### Custom Sign-On Methods

1. **V5_MD5**
   - Verifies token by comparing it to the MD5 hash of `empno` + `V5_MD5_PRESHARED_KEY` + `t_time`
   - The `t_time` parameter should be a Unix timestamp (seconds since epoch)
   - Token comparison is case-insensitive
   - Requires environment variable `V5_MD5_PRESHARED_KEY` or uses default dev key
   - Example to set preshared key: `export V5_MD5_PRESHARED_KEY="your-secure-key"`

#### User Data Handling

The custom sign-on endpoint now supports the following enhanced features:
- **User ID**: Uses `userId` from payload if provided, otherwise uses `empno` as the user ID
- **Role**: Takes `role` from payload if provided, otherwise defaults to "user"
- **Email**: Uses `email` from payload if provided, otherwise generates a default email as `<userId>@example.com`
- **Additional User Data**: Any additional fields in the payload (like `avatar`, `department`, etc.) are included in the JWT token

You can include any additional user data fields in the payload, and they will be automatically included in the generated JWT token.

#### Testing Tools

Run the following commands to help with testing:

```bash
# Generate sample V5_MD5 payloads and curl commands
npm run test-v5-md5

# Test with custom employee numbers
npm run test-v5-md5 123456 789012

# Decode a JWT token to see its contents including headers
npm run decode-jwt <your-jwt-token>
``` 