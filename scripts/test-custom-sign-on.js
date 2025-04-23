/**
 * Test script for custom sign-on endpoint
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
const empnos = ['12345', '67890', '11111'];

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
console.log('\nCustom Sign-On Test');
console.log('=================');
console.log('\nPreshared Key:', PRESHARED_KEY);
console.log('Timestamp:', timestamp);

// Log tokens for test cases
console.log('\nTest Cases:');
empnos.forEach(empno => {
  console.log(`\nEmployee: ${empno}`);
  console.log(`MD5 Token: ${tokens[empno]}`);
  
  // Generate curl command
  const curlCmd = `curl -X POST ${SERVER_URL}${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "V5_MD5",
    "payload": {
      "empno": "${empno}",
      "t_time": "${timestamp}",
      "token": "${tokens[empno]}",
      "role": "employee"
    }
  }'`;
  
  console.log('\nCurl Command:');
  console.log(curlCmd);
  
  // Generate invalid token example
  const invalidToken = tokens[empno].substring(0, tokens[empno].length - 1) + 'X';
  const invalidCurlCmd = `curl -X POST ${SERVER_URL}${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "V5_MD5",
    "payload": {
      "empno": "${empno}",
      "t_time": "${timestamp}",
      "token": "${invalidToken}",
      "role": "employee"
    }
  }'`;
  
  console.log('\nInvalid Token Curl Command:');
  console.log(invalidCurlCmd);
});

console.log('\nTo set the preshared key as an environment variable:');
console.log(`export V5_MD5_PRESHARED_KEY="your-secure-key-here"\n`); 