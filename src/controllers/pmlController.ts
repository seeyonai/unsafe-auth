import querystring from 'querystring';
import axios from 'axios';
import { Request, Response } from 'express';

require('dotenv').config();

const clientId = process.env.PML_CLIENT_ID;
const clientSecret = process.env.PML_CLIENT_SECRET;
const pmlBaseUrl = process.env.PML_BASE_URL || 'http://localhost:3001/api/oauth2';
const redirectUri = process.env.PML_REDIRECT_URI;

const stateMap = new Map<string, string>();
const resourceMap = new Map<string, { name: string; email: string; timestamp: number }>();

export const pml = (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    throw new Error('Missing client ID or client secret');
  }
  
  // Get `state` from req query
  const state = req.query.state as string;
  const callbackUrl = req.query.callback as string;

  console.log('[pml] Received state:', state);
  console.log('[pml] Received callback URL:', callbackUrl);

  if (!state) {
    return res.status(400).send('[pml] State parameter is required');
  }

  // Ensure `state` is unique
  if (stateMap.has(state)) {
    return res.status(400).send('[pml] State parameter must be unique');
  }

  stateMap.set(state, callbackUrl);

  console.log('[pml] Redirecting to Seeyon Chat for authentication');

  const authUrl = `${pmlBaseUrl}/idp/oauth2/authorize?` +
    querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
  res.redirect(authUrl);
};

export const pmlCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  console.log('[pmlCallback] Entering callback with code: ' + code);

  if (error) {
    return res.send(`Error: ${error}`);
  }

  if (!state || typeof state !== 'string' || !stateMap.has(state)) {
    return res.status(400).send('[pmlCallback] Invalid state parameter');
  }

  try {
    // Exchange code for access token
 const tokenResponse = await axios.post(
      `${pmlBaseUrl}/idp/oauth2/getToken?` +
      querystring.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code as string,
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('[pmlCallback] tokenResp', tokenResponse.data)
    const accessToken = tokenResponse.data.access_token;
    console.log('[pmlCallback] accessToken', accessToken)

    // Fetch user info
    const userResponse = await axios.get(`${pmlBaseUrl}/idp/oauth2/getUserInfo?access_token=${accessToken}&client_id=${clientId}`);
    console.log('[pmlCallback] userResponse data', userResponse.data);
    if (userResponse.data.errcode) {
      return res.status(400).send('[pmlCallback] ' + userResponse.data.errcode + ' ' + userResponse.data.msg);
    }
    // Generate a unique code for the resource data
    const resourceCode = 'pml_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('[pmlCallback] resourceCode:', resourceCode);
    
    // Save resource data in-memory with timestamp for cleanup
    resourceMap.set(resourceCode, {
      name: userResponse.data.loginName,
      email: `${userResponse.data.loginName}@pml.com`,
      timestamp: Date.now()
    });

    const redirectUrl = stateMap.get(state as string);
    if (!redirectUrl) {
      return res.status(400).send('[pmlCallback] Invalid state parameter');
    }

    const query = querystring.stringify({
      code: resourceCode,
      state: state,
      provider: 'pml'
    });

    const url = `${redirectUrl}?${query}`;

    // Unset state
    stateMap.delete(state as string);

    console.log('[pmlCallback] Redirecting to:', url);
    res.redirect(url);
  } catch (error: any) {
    console.error('[pmlCallback] Error:', error.response?.data || error.message);
    res.send('[pmlCallback] Authentication failed');
  }
};

export const pmlResource = async (req: Request, res: Response) => {
  const { code } = req.query;
  console.log('[pmlResource] Enter pmlResource with resource code: ' + code);

  if (!code || typeof code !== 'string' || !code.startsWith('pml_')) {
    return res.status(400).json({ error: '[pmlResource] Code parameter is required and must start with pml_' });
  }

  const resourceData = resourceMap.get(code);
  
  if (!resourceData) {
    // Log the resourceMap
    console.log('[pmlResource] resourceMap:', resourceMap);
    return res.status(404).json({ error: `[pmlResource] Resource not found or expired by code: ${code}` });
  }

  // Check if resource is expired (24 hours)
  const isExpired = Date.now() - resourceData.timestamp > 24 * 60 * 60 * 1000;
  
  if (isExpired) {
    resourceMap.delete(code);
    return res.status(404).json({ error: `[pmlResource] Resource expired by code: ${code}` });
  }

  // Remove the resource after successful retrieval (one-time use)
  resourceMap.delete(code);

  res.json({
    name: resourceData.name,
    email: resourceData.email
  });
};
