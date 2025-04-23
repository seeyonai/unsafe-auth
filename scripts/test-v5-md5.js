/**
 * Test script for V5_MD5 custom sign-on endpoint
 * 
 * This script generates the necessary payload with timestamp and token
 * for testing the V5_MD5 custom sign-on endpoint
 */

const crypto = require('crypto-js');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const SERVER_URL = 'http://localhost:4423';
const ENDPOINT = '/api/auth/custom-sign-on';
const PRESHARED_KEY = process.env.V5_MD5_PRESHARED_KEY || 'dev-preshared-key';

if (!PRESHARED_KEY) {
  console.error('V5_MD5_PRESHARED_KEY is not defined in the environment variables');
  process.exit(1);
}

// Employee numbers to test
const empnos = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['12345', '67890'];

// Generate current timestamp
const timestamp = Math.floor(Date.now() / 1000).toString();

// Generate MD5 tokens for each employee number
const generateTokens = () => {
  const tokens = {};
  
  empnos.forEach(empno => {
    tokens[empno] = crypto.MD5(empno + PRESHARED_KEY + timestamp).toString();
  });
  
  return tokens;
};

// Generate tokens
const tokens = generateTokens();

// Log test information
console.log('\nV5_MD5 Custom Sign-On Test');
console.log('========================');
console.log('\nPreshared Key:', PRESHARED_KEY);
console.log('Timestamp:', timestamp);

// Log tokens for test cases
console.log('\nTest Cases:');
empnos.forEach(empno => {
  console.log(`\n--- Employee: ${empno} ---`);
  console.log(`MD5 Token: ${tokens[empno]}`);
  
  // Format JSON for easy copy-paste
  const jsonPayload = JSON.stringify({
    method: "V5_MD5",
    payload: {
      empno: empno,
      t_time: timestamp,
      token: tokens[empno],
      role: "employee"
    }
  }, null, 2);
  
  console.log('\nJSON Payload:');
  console.log(jsonPayload);
  
  // Generate curl command
  const curlCmd = `curl -X POST ${SERVER_URL}${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    method: "V5_MD5",
    payload: {
      empno: empno,
      t_time: timestamp,
      token: tokens[empno],
      role: "employee"
    }
  })}'`;
  
  console.log('\nCurl Command:');
  console.log(curlCmd);
});

console.log('\nTo decode a returned JWT token:');
console.log('npm run decode-jwt <your-jwt-token>');

console.log('\nTo change the preshared key:');
console.log(`export V5_MD5_PRESHARED_KEY="your-secure-key-here"\n`); 