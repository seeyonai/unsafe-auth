# Express Server with JWT Verification

## Plan (Completed)
1. ✓ Set up project structure
   - ✓ Initialize npm project
   - ✓ Install required dependencies (express, typescript, jsonwebtoken, etc.)
   - ✓ Configure TypeScript

2. ✓ Create server setup
   - ✓ Create a basic Express server on port 4423
   - ✓ Set up middleware (cors, json parsing)
   - ✓ Add error handling

3. ✓ Implement JWT verification endpoint
   - ✓ Create a route for JWT verification
   - ✓ Implement verification logic for custom JWT format
   - ✓ Return appropriate responses

4. ✓ Testing Instructions
   - ✓ Created test scripts (`scripts/test-jwt.sh` and `scripts/generate-jwt.js`)
   - ✓ Added npm commands for testing

## Implementation Details
- TypeScript with strict mode enabled
- JWT verification handles custom format (with 'Custom-' prefix)
- Server runs on port 4423
- Proper error handling implemented
- API documentation in README.md
- Testing scripts in scripts/ directory

## Testing Instructions
1. Start the server:
   ```
   npm run dev
   ```

2. Generate test tokens:
   ```
   npm run generate-tokens
   ```

3. Run the API tests:
   ```
   npm run test-api
   ```

4. Testing Instructions
   - Use Postman or curl to test the API
   - Example curl command:
     ```
     curl -X POST http://localhost:4423/api/auth/verify \
       -H "Content-Type: application/json" \
       -d '{"token": "your-jwt-token-here"}'
     ``` 