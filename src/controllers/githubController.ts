import querystring from 'querystring';
import axios from 'axios';
import { Request, Response } from 'express';

require('dotenv').config();

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('Missing client ID or client secret');
}

const config = {
  clientId,
  clientSecret,
  redirectUri: 'http://localhost:4423/api/oauth/github/callback',
  scope: 'user:email'
};

const stateMap = new Map<string, string>();

export const githubAuth = (req: Request, res: Response) => {
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
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state,
    });
  res.redirect(authUrl);
};

export const githubCallback = async (req: Request, res: Response) => {
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
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: config.redirectUri
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

    const redirectUrl = stateMap.get(state as string);
    if (!redirectUrl) {
      return res.status(400).send('Invalid state parameter');
    }
    const query = querystring.stringify({
      name: userResponse.data.login,
      email: primaryEmail
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
