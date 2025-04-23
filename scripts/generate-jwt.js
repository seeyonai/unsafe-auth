/**
 * Generate JWT tokens for testing
 * 
 * This script generates valid and invalid JWT tokens for testing purposes
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Secret key for signing tokens (should match the one in your server)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in the environment variables');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in the environment variables');
  process.exit(1);
}

// Generate a valid token
function generateValidToken() {
  const payload = {
    user: {
      id: '123',
      role: 'admin'
    },
    // Set expiration far in the future for testing
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Generate an expired token
function generateExpiredToken() {
  const payload = {
    user: {
      id: '456',
      role: 'user'
    },
    // Set expiration in the past
    exp: Math.floor(Date.now() / 1000) - (60 * 60) // 1 hour ago
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Generate tokens
const validToken = generateValidToken();
const expiredToken = generateExpiredToken();
const customFormatToken = validToken;
const invalidToken = `${validToken.slice(0, -5)}wrong`;

// Output tokens
console.log('\nTest JWT Tokens');
console.log('==============');
console.log(`\nValid Token:`);
console.log(validToken);
console.log(`\nExpired Token:`);
console.log(expiredToken);
console.log(`\nCustom Format Token:`);
console.log(customFormatToken);
console.log(`\nInvalid Token (wrong signature):`);
console.log(invalidToken);

// Output curl examples
console.log('\nCurl Examples');
console.log('=============');
console.log(`\nValid Token Verification:`);
console.log(`curl -X POST http://localhost:4423/api/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"token": "${validToken}"}'`);

console.log(`\nCustom Format Token Verification:`);
console.log(`curl -X POST http://localhost:4423/api/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"token": "${customFormatToken}"}'`);

console.log(`\nToken Creation:`);
console.log(`curl -X POST http://localhost:4423/api/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "123", "role": "admin"}'`);

console.log(`\nCustom Format Token Creation:`);
console.log(`curl -X POST http://localhost:4423/api/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "456", "role": "user", "useCustomFormat": true, "expiresIn": 3600, "additionalData": {"email": "user@example.com"}}'`);

console.log('\n'); 