import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import githubRoutes from './routes/githubRoutes';
import seeyonChatRoutes from './routes/seeyonChatRoutes';
import pmlRoutes from './routes/pmlRoutes';
const app = express();
const PORT = process.env.PORT || 4423;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server Running' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
