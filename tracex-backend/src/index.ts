import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DatabaseClient } from './db/client.js';
import { createTracesRoutes } from './api/traces.js';
import { createKeysRoutes } from './api/keys.js';
import { createMetricsRoutes } from './api/metrics.js';
import { createOnchainRoutes } from './api/onchain.js';
import { SolanaReader } from './services/solana-reader.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tracex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
};

const db = new DatabaseClient(dbConfig);

const rpcEndpoints = (process.env.SOLANA_RPC_ENDPOINTS || '')
  .split(',')
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);

if (!rpcEndpoints.length) {
  rpcEndpoints.push('https://api.mainnet-beta.solana.com');
}

const solanaReader = new SolanaReader({
  endpoints: rpcEndpoints,
  commitment: (process.env.SOLANA_COMMITMENT as 'processed' | 'confirmed' | 'finalized') || 'confirmed',
  walletCacheTtlMs: parseInt(process.env.ONCHAIN_WALLET_CACHE_TTL_MS || '5000', 10),
  signatureCacheTtlMs: parseInt(process.env.ONCHAIN_SIGNATURE_CACHE_TTL_MS || '5000', 10),
});


const tracesRoutes = createTracesRoutes(db);
const keysRoutes = createKeysRoutes(db);
const metricsRoutes = createMetricsRoutes(db);
const onchainRoutes = createOnchainRoutes(solanaReader);

app.post('/api/traces', tracesRoutes.postTraces);
app.get('/api/traces', tracesRoutes.getTraces);
app.post('/api/keys/register', keysRoutes.registerKey);
app.get('/api/metrics/public', metricsRoutes.getPublicMetrics);
app.post('/api/metrics/publish', metricsRoutes.publishMetrics);
app.get('/api/onchain/wallet', onchainRoutes.getWalletState);
app.post('/api/onchain/signatures', onchainRoutes.postSignatureStatuses);

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

