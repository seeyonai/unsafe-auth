const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Provider server URL
const unsafeAuthServiceBaseURL = process.env.UNSAFE_AUTH_SERVICE_BASE_URL || 'http://localhost:4423/api';
let state;

// Client credentials
const REDIRECT_URI = 'http://localhost:4428/callback';

// Home page with login button
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Welcome to the GitHub OAuth Client</h1>
        <a href="/login">Login with GitHub</a>
      </body>
    </html>
  `);
});

// Redirect to authorization server
app.get('/login', (req, res) => {
  const defaultScope = 'user:email,read:user,user:follow,public_repo,read:org';
  // Read scope from query string, or use default
  let scope = req.query.scope || defaultScope;
  // Ensure scope is a string
  if (Array.isArray(scope)) {
    scope = scope.join(',');
  } else if (typeof scope !== 'string') {
    scope = defaultScope;
  }
  state = Math.random().toString(36).substring(2, 15);
  const authUrl = `${unsafeAuthServiceBaseURL}/oauth/github?state=${state}&callback=${REDIRECT_URI}&scope=${encodeURIComponent(scope)}`;
  console.log('[Client] Redirecting user to authorization server:', authUrl);
  res.redirect(authUrl);
});

// Handle callback and exchange code for token
app.get('/callback', async (req, res) => {
  const { code, state, provider } = req.query;
  
  // check if state is the same as the one we generated
  if (req.query.state !== state) {
    return res.status(400).send('Invalid state');
  }
  
  console.log('[Client] Received callback with code:', code);
  
  try {
    // Use the code to retrieve the actual user resource data
    const resourceResponse = await axios.get(`${unsafeAuthServiceBaseURL}/oauth/github/resource?code=${code}`);
    const userData = resourceResponse.data;
    
    console.log('[Client] Retrieved user data:', userData);
    
    res.send(`
      <html>
        <body>
          <h1>Authentication Successful!</h1>
          <h2>User Information:</h2>
          <p><strong>Name:</strong> ${userData.name}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Provider:</strong> ${provider}</p>
          <a href="/">Go back to home</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[Client] Error retrieving user resource:', error.response ? error.response.data : error.message);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error</h1>
          <p>Failed to retrieve user data: ${error.response ? error.response.data.error : error.message}</p>
          <a href="/">Go back to home</a>
        </body>
      </html>
    `);
  }
});

app.listen(4428, () => console.log('Client on http://localhost:4428'));