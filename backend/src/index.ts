import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeConnection, initializeDatabase, db } from './database.js';
import recordingsRouter from './routes/recordings.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? undefined : '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('uploads'));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize database on startup
let dbReady = false;

(async () => {
  try {
    await initializeConnection();
    await initializeDatabase();
    dbReady = true;
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: dbReady ? 'ok' : 'initializing',
    database: dbReady ? 'connected' : 'connecting',
  });
});

// API status
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'API is running',
    version: '1.0.0',
  });
});

// Routes
app.use('/api/recordings', recordingsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✓ Server is running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Frontend: http://localhost:3000\n`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} is already in use`);
  } else {
    console.error('✗ Server error:', error);
  }
  process.exit(1);
});
