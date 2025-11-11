import pg from 'pg';
import type { DatabaseConfig } from './schema.js';

const { Pool } = pg;

export class DatabaseClient {
  private pool: pg.Pool;
  private initialized = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // максимальное количество соединений
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Обработка ошибок соединения
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  /**
   * Инициализация схемы БД
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'encrypted_traces'
        );
      `);

        if (!result.rows[0].exists) {
          const { createSchemaSQL } = await import('./schema.js');
          await this.pool.query(createSchemaSQL);
          console.log('Database schema created successfully');
        }

        this.initialized = true;
        return;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts - 1;
        console.error('Failed to initialize database:', error);

        if (isLastAttempt) {
          throw error;
        }

        const backoffMs = Math.min(5000, 500 * Math.pow(2, attempt));
        await this.delay(backoffMs);
      }
    }
  }

  /**
   * Сохранение зашифрованного trace
   */
  async saveEncryptedTrace(
    traceId: string,
    facilitatorId: string | null,
    encryptedData: string,
    aesKeyEncrypted: string,
    iv: string
  ): Promise<void> {
    const query = `
      INSERT INTO encrypted_traces (
        trace_id, facilitator_id, encrypted_data, aes_key_encrypted, iv
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `;

    await this.pool.query(query, [traceId, facilitatorId, encryptedData, aesKeyEncrypted, iv]);
  }

  /**
   * Регистрация публичного ключа facilitator'а
   */
  async registerFacilitatorKey(facilitatorId: string, publicKey: string): Promise<void> {
    const query = `
      INSERT INTO facilitator_keys (facilitator_id, public_key)
      VALUES ($1, $2)
      ON CONFLICT (facilitator_id) 
      DO UPDATE SET 
        public_key = EXCLUDED.public_key,
        updated_at = NOW()
    `;

    await this.pool.query(query, [facilitatorId, publicKey]);
  }

  /**
   * Получение зашифрованных traces по facilitator_id
   */
  async getEncryptedTraces(
    facilitatorId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{
    traceId: string;
    encryptedData: string;
    aesKeyEncrypted: string;
    iv: string;
    createdAt: Date;
  }>> {
    const query = `
      SELECT 
        trace_id,
        encrypted_data,
        aes_key_encrypted,
        iv,
        created_at
      FROM encrypted_traces
      WHERE facilitator_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [facilitatorId, limit, offset]);

    return result.rows.map((row) => ({
      traceId: row.trace_id,
      encryptedData: row.encrypted_data,
      aesKeyEncrypted: row.aes_key_encrypted,
      iv: row.iv,
      createdAt: row.created_at,
    }));
  }

  async savePublicMetrics(
    facilitatorId: string,
    successRate: number,
    avgLatency: number,
    totalTransactions: number,
    period: string
  ): Promise<void> {
    const query = `
      INSERT INTO public_metrics (
        facilitator_id, success_rate, avg_latency, total_transactions, period
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (facilitator_id, period, timestamp) 
      DO UPDATE SET
        success_rate = EXCLUDED.success_rate,
        avg_latency = EXCLUDED.avg_latency,
        total_transactions = EXCLUDED.total_transactions
    `;

    await this.pool.query(query, [facilitatorId, successRate, avgLatency, totalTransactions, period]);
  }

  async getPublicMetrics(period: string = '24h', limit: number = 100): Promise<Array<{
    facilitatorId: string;
    successRate: number;
    avgLatency: number;
    totalTransactions: number;
    timestamp: Date;
  }>> {
    const query = `
      SELECT 
        facilitator_id,
        success_rate,
        avg_latency,
        total_transactions,
        timestamp
      FROM public_metrics
      WHERE period = $1
      ORDER BY timestamp DESC, success_rate DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [period, limit]);

    return result.rows.map((row) => ({
      facilitatorId: row.facilitator_id,
      successRate: parseFloat(row.success_rate),
      avgLatency: parseFloat(row.avg_latency),
      totalTransactions: parseInt(row.total_transactions, 10),
      timestamp: row.timestamp,
    }));
  }

  /**
   * Закрытие соединения с БД
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Получить pool для прямого доступа (если нужно)
   */
  getPool(): pg.Pool {
    return this.pool;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

