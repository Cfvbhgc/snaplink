import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { getRedisClient } from './config/redis';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import linksRouter from './routes/links';
import analyticsRouter from './routes/analytics';
import redirectRouter from './routes/redirect';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Global middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/links', linksRouter);
app.use('/api/analytics', analyticsRouter);

// Redirect handler (must come after API routes to avoid collisions)
app.use('/', redirectRouter);

// Error handler
app.use(errorHandler);

async function start() {
  try {
    await getRedisClient();
    app.listen(PORT, () => {
      console.log(`[snaplink] server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[snaplink] failed to start:', err);
    process.exit(1);
  }
}

start();
