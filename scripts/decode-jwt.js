/**
 * JWT Decoder Utility
 * 
 * This script decodes and displays the contents of JWT tokens including their headers.
 * Usage: node decode-jwt.js [token]
 */

// Check if token was provided as argument
const token = process.argv[2];

if (!token) {
  console.log('\nUsage: node decode-jwt.js [token]');
  console.log('Please provide a JWT token as an argument.\n');
  process.exit(1);
}

/**
 * Decode a JWT token without verification
 * @param {string} token - The JWT token to decode
 * @returns {Object} The decoded token parts
 */
function decodeJwt(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Base64 decode and parse each part
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      header,
      payload,
      signature: parts[2],
    };
  } catch (error) {
    console.error('Error decoding token:', error.message);
    process.exit(1);
  }
}

// Decode the token
const decoded = decodeJwt(token);

// Display the decoded token
console.log('\nDecoded JWT Token');
console.log('=================');

console.log('\nHeader:');
console.log(JSON.stringify(decoded.header, null, 2));

console.log('\nPayload:');
console.log(JSON.stringify(decoded.payload, null, 2));

console.log('\nSignature (base64url):');
console.log(decoded.signature);

// Check if token is expired
const now = Math.floor(Date.now() / 1000);
if (decoded.payload.exp) {
  const expiresIn = decoded.payload.exp - now;
  console.log('\nExpiration:');
  if (expiresIn <= 0) {
    console.log(`Token is expired (${Math.abs(expiresIn)} seconds ago)`);
  } else {
    console.log(`Token expires in ${expiresIn} seconds (${Math.floor(expiresIn / 60)} minutes)`);
  }
}

// Check for custom auth method
if (decoded.header.auth_method) {
  console.log('\nAuthentication Method:');
  console.log(decoded.header.auth_method);
}

console.log('\n'); 