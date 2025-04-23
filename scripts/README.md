# Testing Scripts

This directory contains scripts for testing the JWT verification API.

## Available Scripts

### `test-jwt.sh`

A shell script that tests the JWT verification endpoint with various token scenarios.

Usage:
```bash
# Make sure the script is executable
chmod +x test-jwt.sh

# Run the script
./test-jwt.sh
```

Requirements:
- `jq` command for JSON formatting (install with `brew install jq` on macOS)
- The server must be running on port 4423

### `generate-jwt.js`

A JavaScript script to generate various JWT tokens for testing.

Usage:
```bash
# Run the script
node generate-jwt.js
```

This script will output:
- Valid JWT token
- Expired JWT token
- Custom format JWT token
- Invalid JWT token
- Curl commands for testing

The tokens generated will use the same secret key as configured in the server. 