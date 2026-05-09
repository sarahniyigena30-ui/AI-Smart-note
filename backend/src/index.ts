import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeConnection, initializeDatabase, db } from './database.js';
import recordingsRouter from './routes/recordings.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './auth.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? undefined : '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('uploads'));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

let dbReady = false;

(async () => {
  try {
    await initializeConnection();
    await initializeDatabase();
    dbReady = true;
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: dbReady ? 'ok' : 'initializing',
    database: dbReady ? 'connected' : 'connecting',
  });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'API is running',
    version: '1.0.0',
    processing: 'internal-nlp',
  });
});

app.use('/api/auth', authRouter);

app.get('/api/model/voice-metrics', requireAuth, (_req: Request, res: Response) => {
  const metricsPath = path.join(rootDir, 'models', 'voice_metrics.json');

  if (!fs.existsSync(metricsPath)) {
    res.status(404).json({
      success: false,
      error: 'Voice model metrics not found. Run scripts/train_voice_model.py first.',
    });
    return;
  }

  try {
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Failed to read voice model metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read voice model metrics.',
    });
  }
});

app.use('/api/recordings', requireAuth, recordingsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const server = app.listen(PORT, () => {
  console.log(`\nServer is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log('Frontend: http://localhost:3000\n');
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(err ? 1 : 0);
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
