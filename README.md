# Unsafe Auth API

A minimal Express server with JWT verification endpoints for custom format tokens.

Visit [DeepWiki](https://deepwiki.com/seeyonai/unsafe-auth) for visualizations and conversational AI Assistant.

## Features
- Express server with TypeScript
- Custom JWT verification endpoint
- Strict type checking
- CORS enabled

## OAuth2 Login Agents (GitHub & Seeyon Chat)

This project includes modular OAuth2 login agents for GitHub and Seeyon Chat, implemented in:
- `src/controllers/githubController.ts`
- `src/controllers/seeyonChatController.ts`

These agents act as OAuth2 clients, allowing your application to authenticate users via external providers and receive user information securely.

### How the OAuth2 Login Flow Works

1. **Start OAuth2 Login**
   - Your app redirects the user to `/api/oauth/github` or `/api/oauth/seeyon-chat` with required query parameters:
     - `state`: A unique string for CSRF protection and session tracking.
     - `callback`: The URL in your application to receive the authenticated user data.

2. **Redirect to Provider**
   - The login agent builds an authorization URL for the OAuth2 provider (GitHub or Seeyon Chat) and redirects the user there.
   - The `state` and `redirect_uri` are included in the request.

3. **User Grants Access**
   - The user logs in and authorizes your app at the provider's site.
   - The provider redirects the user back to the agent's callback endpoint (`/api/oauth/github/callback` or `/api/oauth/seeyon-chat/callback`) with a temporary `code` and the original `state`.

4. **Exchange Code for Access Token**
   - The agent exchanges the received `code` for an access token by making a server-to-server request to the provider.

5. **Fetch User Info**
   - Using the access token, the agent fetches the user's profile (and email for GitHub) from the provider's API.

6. **Redirect Back to Application**
   - The agent looks up the original `callback` URL using the `state` value.
   - It redirects the user to this callback URL, appending the user's name and email as query parameters.

### Example Flow Diagram

```
[Your App] --(state, callback)--> [Login Agent /api/oauth/github] --redirect--> [GitHub Auth]
   <--redirect-- [GitHub Auth] <-- [Login Agent /api/oauth/github/callback] <-- [GitHub API]
   <--redirect-- [Your App callback URL?name=...&email=...]
```

### Security Notes
- The `state` parameter is required and must be unique per login attempt. It is used to prevent CSRF and to map the OAuth session back to the correct callback.
- The callback URL is never sent to the OAuth provider; it is stored server-side and only used after authentication.

### Endpoints
- **GitHub:**
  - `GET /api/oauth/github` — Initiates the OAuth2 login with GitHub.
  - `GET /api/oauth/github/callback` — Handles the GitHub OAuth2 callback.
- **Seeyon Chat:**
  - `GET /api/oauth/seeyon-chat` — Initiates the OAuth2 login with Seeyon Chat.
  - `GET /api/oauth/seeyon-chat/callback` — Handles the Seeyon Chat OAuth2 callback.

### Environment Variables
- For GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- For Seeyon Chat: `SEEYON_CHAT_CLIENT_ID`, `SEEYON_CHAT_CLIENT_SECRET`, `SEEYON_CHAT_BASE_URL`

---

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