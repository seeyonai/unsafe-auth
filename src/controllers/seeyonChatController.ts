import querystring from 'querystring';
import axios from 'axios';
import { Request, Response } from 'express';

require('dotenv').config();

const clientId = process.env.SEEYON_CHAT_CLIENT_ID;
const clientSecret = process.env.SEEYON_CHAT_CLIENT_SECRET;
const seeyonChatBaseUrl = process.env.SEEYON_CHAT_BASE_URL || 'http://localhost:3001/api/oauth2';
const redirectUri = 'http://localhost:4423/api/oauth/seeyon-chat/callback';
const scope = 'name email';

const stateMap = new Map<string, string>();
const resourceMap = new Map<string, { name: string; email: string; timestamp: number }>();

export const seeyonChat = (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    throw new Error('Missing client ID or client secret');
  }
  
  // Get `state` from req query
  const state = req.query.state as string;
  const callbackUrl = req.query.callback as string;

  console.log('[seeyonChat] Received state:', state);
  console.log('[seeyonChat] Received callback URL:', callbackUrl);

  if (!state) {
    return res.status(400).send('State parameter is required');
  }

  // Ensure `state` is unique
  if (stateMap.has(state)) {
    return res.status(400).send('State parameter must be unique');
  }

  stateMap.set(state, callbackUrl);

  console.log('[seeyonChat] Redirecting to Seeyon Chat for authentication');

  const authUrl = `${seeyonChatBaseUrl}/authorize?` +
    querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });
  res.redirect(authUrl);
};

export const seeyonChatCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`Error: ${error}`);
  }

  if (!state || typeof state !== 'string' || !stateMap.has(state)) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      `${seeyonChatBaseUrl}/token`,
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
    const userResponse = await axios.get(`${seeyonChatBaseUrl}/resource`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Generate a unique code for the resource data
    const resourceCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save resource data in-memory with timestamp for cleanup
    resourceMap.set(resourceCode, {
      name: userResponse.data.name,
      email: userResponse.data.email,
      timestamp: Date.now()
    });

    const redirectUrl = stateMap.get(state as string);
    if (!redirectUrl) {
      return res.status(400).send('Invalid state parameter');
    }

    const query = querystring.stringify({
      code: resourceCode,
      state: state,
      provider: 'seeyon-chat'
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

export const seeyonChatResource = async (req: Request, res: Response) => {
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