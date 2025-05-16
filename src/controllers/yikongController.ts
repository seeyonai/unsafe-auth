import querystring from 'querystring';
import axios from 'axios';
import { Request, Response, urlencoded } from 'express';
import { LRUCache } from 'lru-cache'

require('dotenv').config({ path: ['.env.local', '.env'] });

const lruOptions = {
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
}

export const cache = new LRUCache<string, { name: string, email: string }>(lruOptions);

const clientId = process.env.YIKONG_CLIENT_ID;
const clientSecret = process.env.YIKONG_CLIENT_SECRET;
const redirectUri = process.env.YIKONG_REDIRECT_URI;

const yikongBaseUrl = process.env.YIKONG_BASE_URL;

console.log('[yikongAuth] Yikong base URL:', yikongBaseUrl);
console.log('[yikongAuth] Yikong client ID:', clientId);
console.log('[yikongAuth] Yikong client secret:', clientSecret);
console.log('[yikongAuth] Yikong redirect URI:', redirectUri);

// stateMap is used to store the state and callback URL
// state is app name
const stateMap = new Map<string, string>();

export const yikongAuth = (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    return res.status(500).send('Yikong client ID or client secret is not configured');
  }
  // Get `state` from req query
  const state = req.query.state as string;
  const callbackUrl = req.query.callback as string;

  console.log('[yikongAuth] Received state:', state);
  console.log('[yikongAuth] Received callback URL:', callbackUrl);

  if (!state) {
    return res.status(400).send('State parameter is required');
  }

  stateMap.set(state, callbackUrl);

  console.log('[yikongAuth] Redirecting to Yikong for authentication');

  const authUrl = `${yikongBaseUrl}/esc-sso/oauth2.0/authorize?` +
    querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
  console.log('[yikongAuth] Redirecting to Yikong for authentication', authUrl);
  res.redirect(authUrl);
};

export const yikongCallback = async (req: Request, res: Response) => {
  if (!clientId || !clientSecret) {
    return res.status(500).send('Yikong client ID or client secret is not configured');
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
      `${yikongBaseUrl}/esc-sso/oauth2.0/accessToken?` +
        querystring.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
          redirect_uri: redirectUri
      }),
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        proxy: {
          host: '81.70.173.87',
          port: 6500,
          protocol: 'http',
          auth: {
            username: 'abc',
            password: 'abc',
          }
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user info
    const userResponse = await axios.get(`${yikongBaseUrl}/esc-sso/oauth2.0/profile?${querystring.stringify({
      access_token: accessToken
    })}`, {
      headers: {
        // Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      proxy: {
        host: '81.70.173.87',
        port: 6500,
        protocol: 'http',
        auth: {
          username: 'abc',
          password: 'abc',
        }
      }
    });

    console.log('userResponse', userResponse.data);
      // {
    //   attributes: {
    //     user_name: '致远',
    //     mobile: '18745678901',
    //     account_no: 'zhiyuan',
    //     token_gtime: 1739779597171,
    //     token_expired: '7200',
    //     email: '1234567890@qq.com'
    //   },
    //   id: 'zhiyuan'
    // }
    const userInfo = userResponse.data.attributes;
    const userId = userResponse.data.id;

    const redirectUrl = stateMap.get(state as string);
    if (!redirectUrl) {
      return res.status(400).send('Invalid state parameter');
    }
    const query = querystring.stringify({
      userId: userId,
      name: userInfo.user_name,
      email: `${userId}@example.com`,
    });

    const url = `${redirectUrl}?${query}`;
    cache.set(userId as string, {
      name: userInfo.user_name,
      email: `${userId}@example.com`,
    });

    console.log('Redirecting to:', url);
    res.redirect(url);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    res.send('Authentication failed');
  }
};

