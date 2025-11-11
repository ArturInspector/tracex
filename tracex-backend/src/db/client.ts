import pg from 'pg';
import type { PoolConfig } from 'pg';
import type { DatabaseConfig } from './schema.js';

const { Pool } = pg;

export class DatabaseClient {
  private pool: pg.Pool;
  private initialized = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(this.createPoolConfig(config));

    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }


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
        } else {
          await this.ensureSchemaUpgrades();
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


  async saveEncryptedTrace(
    traceId: string,
    facilitatorId: string | null,
    encryptedData: string,
    aesKeyEncrypted: string,
    iv: string,
    tags: string[]
  ): Promise<void> {
    const query = `
      INSERT INTO encrypted_traces (
        trace_id, facilitator_id, encrypted_data, aes_key_encrypted, iv, tags
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `;

    await this.pool.query(query, [traceId, facilitatorId, encryptedData, aesKeyEncrypted, iv, tags]);
  }
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
    tags: string[];
    createdAt: Date;
  }>> {
    const query = `
      SELECT 
        trace_id,
        encrypted_data,
        aes_key_encrypted,
        iv,
        tags,
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
      tags: row.tags || [],
      createdAt: row.created_at,
    }));
  }

  async getTagSummary(options: {
    facilitatorId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    minCount?: number;
  }): Promise<Array<{
    tag: string;
    count: number;
    lastSeenAt: Date;
  }>> {
    const { facilitatorId, from, to, limit = 25, minCount = 1 } = options;

    const whereClauses: string[] = ['tags IS NOT NULL', 'array_length(tags, 1) > 0'];
    const params: Array<string | number | Date> = [];

    if (facilitatorId) {
      params.push(facilitatorId);
      whereClauses.push(`facilitator_id = $${params.length}`);
    }

    if (from) {
      params.push(from);
      whereClauses.push(`created_at >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      whereClauses.push(`created_at <= $${params.length}`);
    }

    const aggregatedQuery = `
      SELECT 
        tag,
        COUNT(*) AS count,
        MAX(created_at) AS last_seen_at
      FROM (
        SELECT 
          UNNEST(tags) AS tag,
          created_at
        FROM encrypted_traces
        WHERE ${whereClauses.join(' AND ')}
      ) AS exploded
      GROUP BY tag
      HAVING COUNT(*) >= $${params.length + 1}
      ORDER BY count DESC, last_seen_at DESC
      LIMIT $${params.length + 2}
    `;

    params.push(minCount);
    params.push(limit);

    const result = await this.pool.query(aggregatedQuery, params);

    return result.rows.map((row) => ({
      tag: row.tag,
      count: parseInt(row.count, 10),
      lastSeenAt: row.last_seen_at,
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

  private async ensureSchemaUpgrades(): Promise<void> {
    // Добавляем колонку tags, если её нет
    const tagsColumn = await this.pool.query(`
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'encrypted_traces' 
        AND column_name = 'tags'
      LIMIT 1
    `);

    if (tagsColumn.rowCount === 0) {
      await this.pool.query(`
        ALTER TABLE encrypted_traces
        ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
      `);
    }

    // Индекс для поиска по тегам
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_encrypted_traces_tags 
      ON encrypted_traces USING GIN (tags)
    `);
  }

  private createPoolConfig(config: DatabaseConfig): PoolConfig {
    const baseConfig: PoolConfig = {
      connectionString: process.env.DATABASE_URL!,
      ssl: { rejectUnauthorized: false },
    };
    

    const sslOption = this.normalizeSsl(config.ssl, Boolean(config.connectionString));
    if (sslOption !== undefined) {
      baseConfig.ssl = sslOption;
    }

    baseConfig.max = config.maxConnections ?? 20;
    baseConfig.idleTimeoutMillis = 30000;
    baseConfig.connectionTimeoutMillis = 2000;

    return baseConfig;
  }

  private normalizeSsl(
    ssl: DatabaseConfig['ssl'],
    hasConnectionString: boolean
  ): PoolConfig['ssl'] | undefined {
    if (ssl === false) {
      return false;
    }

    if (ssl === true || (ssl === undefined && hasConnectionString)) {
      return { rejectUnauthorized: false };
    }

    if (ssl && typeof ssl === 'object') {
      return ssl as PoolConfig['ssl'];
    }

    return undefined;
  }
}

