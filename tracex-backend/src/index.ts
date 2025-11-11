/**
 * TraceX Backend API Server
 * Express сервер для приема и хранения зашифрованных traces
 */

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DatabaseClient } from './db/client.js';
import { createTracesRoutes } from './api/traces.js';
import { createKeysRoutes } from './api/keys.js';
import { createMetricsRoutes } from './api/metrics.js';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tracex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
};

const db = new DatabaseClient(dbConfig);

// API Routes
const tracesRoutes = createTracesRoutes(db);
const keysRoutes = createKeysRoutes(db);
const metricsRoutes = createMetricsRoutes(db);

app.post('/api/traces', tracesRoutes.postTraces);
app.get('/api/traces', tracesRoutes.getTraces);
app.post('/api/keys/register', keysRoutes.registerKey);
app.get('/api/metrics/public', metricsRoutes.getPublicMetrics);
app.post('/api/metrics/publish', metricsRoutes.publishMetrics);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3002', 10);

async function start() {
  try {
    await db.initialize();
    
    app.listen(PORT, () => {
      console.log(`TraceX Backend API running on port ${PORT}`);
      console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down TraceX Backend...');
  await db.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

export { app, db };

