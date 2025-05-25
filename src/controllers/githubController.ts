import querystring from 'querystring';
import axios from 'axios';
import { Request, Response } from 'express';

require('dotenv').config();

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:4423/api/oauth/github/callback';

const stateMap = new Map<string, string>();
const resourceMap = new Map<string, { name: string; email: string; timestamp: number }>();

export const githubAuth = (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    return res.status(500).send('GitHub client ID or client secret is not configured');
  }
  // Get `state` from req query
  const state = req.query.state as string;
  const callbackUrl = req.query.callback as string;

  console.log('[githubAuth] Received state:', state);
  console.log('[githubAuth] Received callback URL:', callbackUrl);

  if (!state) {
    return res.status(400).send('State parameter is required');
  }

  // Ensure `state` is unique
  if (stateMap.has(state)) {
    return res.status(400).send('State parameter must be unique');
  }

  stateMap.set(state, callbackUrl);

  console.log('[githubAuth] Redirecting to GitHub for authentication');

  const authUrl = `https://github.com/login/oauth/authorize?` +
    querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    });
  res.redirect(authUrl);
};

export const githubCallback = async (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    return res.status(500).send('GitHub client ID or client secret is not configured');
  }
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`Error: ${error}`);
  }

  if (!state || typeof state !== 'string' || !stateMap.has(state)) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Fetch user emails to get primary email
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('userResponse', userResponse.data);
    console.log('emailResponse', emailResponse.data);
    // Find primary email
    const primaryEmail = emailResponse.data.find((email: any) => email.primary && email.verified)?.email;

    // Generate a unique code for the resource data
    const resourceCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save resource data in-memory with timestamp for cleanup
    resourceMap.set(resourceCode, {
      name: userResponse.data.login,
      email: primaryEmail,
      timestamp: Date.now()
    });

    const redirectUrl = stateMap.get(state as string);
    if (!redirectUrl) {
      return res.status(400).send('Invalid state parameter');
    }

    const query = querystring.stringify({
      code: resourceCode,
      state: state,
      provider: 'github'
    });

    const url = `${redirectUrl}?${query}`;

    // Unset state
    stateMap.delete(state as string);

    console.log('Redirecting to:', url);
    res.redirect(url);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    res.send('Authentication failed');
  }
};

export const githubResource = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const resourceData = resourceMap.get(code);
  
  if (!resourceData) {
    return res.status(404).json({ error: 'Resource not found or expired' });
  }

  // Check if resource is expired (24 hours)
  const isExpired = Date.now() - resourceData.timestamp > 24 * 60 * 60 * 1000;
  
  if (isExpired) {
    resourceMap.delete(code);
    return res.status(404).json({ error: 'Resource expired' });
  }

  // Remove the resource after successful retrieval (one-time use)
  resourceMap.delete(code);

  res.json({
    name: resourceData.name,
    email: resourceData.email
  });
};
