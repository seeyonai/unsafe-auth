import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/authRoutes';
import githubRoutes from './routes/githubRoutes';
import seeyonChatRoutes from './routes/seeyonChatRoutes';
import pmlRoutes from './routes/pmlRoutes';

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4423;
const HTTPS_PORT = process.env.HTTPS_PORT || 4424;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server Running',
    secure: req.secure,
    protocol: req.secure ? 'https' : 'http',
    port: req.secure ? HTTPS_PORT : HTTP_PORT
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', githubRoutes);
app.use('/api/oauth', seeyonChatRoutes);
app.use('/api/oauth', pmlRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// SSL Configuration
const sslEnabled = process.env.SSL_ENABLED === 'true';

if (sslEnabled) {
  try {
    const keyPath = path.join(__dirname, '../certs/server.key');
    const certPath = path.join(__dirname, '../certs/server.crt');
    
    // Check if certificate files exist
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      throw new Error('SSL certificate files not found');
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    // Start HTTPS server
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server is running on port ${HTTPS_PORT}`);
      console.log(`🔗 Visit: https://localhost:${HTTPS_PORT}`);
    });

    // Optional: Redirect HTTP to HTTPS
    const httpApp = express();
    httpApp.use((req, res) => {
      const httpsUrl = `https://${req.headers.host?.replace(HTTP_PORT.toString(), HTTPS_PORT.toString())}${req.url}`;
      res.redirect(301, httpsUrl);
    });
    
    http.createServer(httpApp).listen(HTTP_PORT, () => {
      console.log(`🔄 HTTP Server redirecting from port ${HTTP_PORT} to HTTPS`);
    });

  } catch (error) {
    console.error('❌ SSL certificates not found or invalid. Running HTTP server instead.');
    console.error('Make sure certificates exist in ./certs/ directory');
    console.error('Run the certificate generation commands to create them.');
    
    // Fallback to HTTP
    http.createServer(app).listen(HTTP_PORT, () => {
      console.log(`🌐 HTTP Server is running on port ${HTTP_PORT} (SSL fallback)`);
      console.log(`🔗 Visit: http://localhost:${HTTP_PORT}`);
    });
  }
} else {
  // Start HTTP server
  http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP Server is running on port ${HTTP_PORT}`);
    console.log(`🔗 Visit: http://localhost:${HTTP_PORT}`);
  });
}

export default app;
