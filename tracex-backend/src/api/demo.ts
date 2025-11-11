import type { Request, Response } from 'express';
import type { DatabaseClient } from '../db/client.js';
import { EncryptionService } from '@arturinspector/tracex-logger';
import type { Trace } from '@arturinspector/tracex-logger';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

const generateKeyPairAsync = promisify(generateKeyPair);

const OPERATIONS = [
  'verify_payment',
  'validate_signature',
  'check_nonce',
  'query_rpc',
  'store_transaction',
  'settle_payment',
  'update_balance',
  'emit_webhook',
];

const RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
];

const CLUSTERS = ['mainnet-beta', 'devnet'];

function generateMockSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMockWallet(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMockTrace(): Trace {
  const traceId = randomBytes(16).toString('hex');
  const now = Date.now();
  const isSuccess = Math.random() > 0.15;

  let durationMs: number;
  const rand = Math.random();
  if (rand < 0.6) {
    durationMs = Math.random() * 0.8 + 0.1;
  } else if (rand < 0.9) {
    durationMs = Math.random() * 9 + 1;
  } else {
    durationMs = Math.random() * 90 + 10;
  }

  const operation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];
  const signature = Math.random() > 0.3 ? generateMockSignature() : undefined;
  const wallet = Math.random() > 0.4 ? generateMockWallet() : undefined;
  const cluster = CLUSTERS[Math.floor(Math.random() * CLUSTERS.length)];
  const rpc = RPCS[Math.floor(Math.random() * RPCS.length)];

  return {
    traceId,
    spans: [
      {
        name: operation,
        startTime: now - durationMs,
        endTime: now,
        duration: durationMs * 1_000_000,
        status: isSuccess ? 'success' : 'error',
        ...(isSuccess ? {} : { 
          error: { 
            message: 'RPC timeout after 30s',
            code: 'TIMEOUT'
          } 
        }),
        attributes: {
          ...(signature && { 'solana.signature': signature }),
          ...(wallet && { 'solana.wallet': wallet }),
          'solana.cluster': cluster,
          'solana.rpc': rpc,
        },
      },
    ],
    metadata: {
      facilitator: 'demo-facilitator',
      demo: true,
    },
  };
}

export function createDemoRoutes(db: DatabaseClient) {
  const generateDemo = async (_req: Request, res: Response): Promise<void> => {
    try {
      const facilitatorId = `demo_${randomBytes(8).toString('hex')}`;

      // Генерируем RSA keypair
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Регистрируем public key
      await db.registerFacilitatorKey(facilitatorId, publicKey);

      // Создаём EncryptionService из SDK (публичный API!)
      const encryptionService = new EncryptionService();

      // Генерируем и шифруем traces
      const spanCount = 30;
      const savedSpans = [];

      for (let i = 0; i < spanCount; i++) {
        const trace = generateMockTrace();
        
        // Шифруем через SDK - он всё делает правильно!
        const encrypted = await encryptionService.encryptTrace(trace, publicKey, facilitatorId);
        
        // Берём имя первого span для тегов
        const firstSpan = trace.spans[0];
        const operationType = firstSpan?.name?.split('_')[0] || 'unknown';
        
        await db.saveEncryptedTrace(
          encrypted.traceId,
          facilitatorId,
          encrypted.encryptedData,
          encrypted.aesKeyEncrypted,
          encrypted.iv,
          ['demo', 'x402', operationType]
        );

        savedSpans.push(trace.traceId);
      }

      // Возвращаем credentials
      res.status(200).json({
        success: true,
        facilitatorId,
        decryptKey: Buffer.from(privateKey).toString('base64'),
        spansGenerated: savedSpans.length,
        message: 'Demo data generated successfully. Redirecting to dashboard...',
      });
    } catch (error) {
      console.error('Failed to generate demo data:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };

  return {
    generateDemo,
  };
}

