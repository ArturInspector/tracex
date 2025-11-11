import { Span } from './span.js';
import { CircularBuffer } from './buffer.js';
import { Transport } from './transport.js';
import { KeyManager } from './crypto/key-manager.js';
import type {
  TraceConfig,
  TraceMetadata,
  SpanData,
  Trace,
  PublicMetrics,
} from './types.js';

export class X402Tracer {
  private readonly config: Required<Omit<TraceConfig, 'apiKey' | 'apiUrl' | 'encryption' | 'publicMetrics'>> & {
    apiKey?: string;
    apiUrl?: string;
    encryption?: TraceConfig['encryption'];
    publicMetrics?: TraceConfig['publicMetrics'];
  };
  private readonly buffer: CircularBuffer;
  private readonly transport: Transport | null;
  private readonly keyManager: KeyManager | null;
  private readonly metadata: TraceMetadata;
  private traceId: string;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isShuttingDown = false;
  private traceMetrics: {
    success: number;
    error: number;
    totalLatency: number;
    count: number;
  } = { success: 0, error: 0, totalLatency: 0, count: 0 };

  constructor(config: TraceConfig = {}) {
    this.config = {
      bufferSize: 1000,
      batchSize: 100,
      flushIntervalMs: 5000,
      autoFlush: true,
      metadata: {},
      ...config,
    };

    this.buffer = new CircularBuffer(this.config.bufferSize);

    // Инициализация шифрования
    if (this.config.encryption?.enabled) {
      this.keyManager = new KeyManager({
        keysPath: this.config.encryption.keysPath,
      });
      // Генерируем ключи асинхронно при первом использовании
      this.keyManager.getOrGenerateKeys().catch((error) => {
        console.error('[X402Tracer] Failed to initialize keys:', error);
      });
    } else {
      this.keyManager = null;
    }

    // Инициализация Transport
    if (this.config.apiUrl) {
      this.transport = new Transport({
        apiUrl: this.config.apiUrl,
        apiKey: this.config.apiKey,
        encryptionEnabled: this.config.encryption?.enabled || false,
        keyManager: this.keyManager || undefined,
        facilitatorId: this.config.encryption?.facilitatorId,
      });
    } else {
      this.transport = null;
    }

    this.metadata = { ...this.config.metadata };
    this.traceId = this.generateTraceId();
    if (this.config.autoFlush && this.transport) {
      this.startAutoFlush();
    }
  }

  startSpan(name: string): Span {
    return new Span(name, this.traceId, (spanData) => {
      this.onSpanComplete(spanData);
    });
  }

  addMetadata(key: string, value: unknown): void {
    this.metadata[key] = value;
  }

  async flush(): Promise<void> {
    if (!this.transport) {
      this.buffer.clear();
      return;
    }

    const spans = this.buffer.drain();

    if (spans.length === 0) {
      return;
    }

    await this.sendBatches(spans);
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();
  }

  private onSpanComplete(spanData: SpanData): void {
    this.buffer.push(spanData);

    // Обновляем метрики для публикации
    if (this.config.publicMetrics?.enabled) {
      this.traceMetrics.count++;
      if (spanData.status === 'success') {
        this.traceMetrics.success++;
      } else {
        this.traceMetrics.error++;
      }
      this.traceMetrics.totalLatency += spanData.duration / 1e6; // конвертируем наносекунды в миллисекунды
    }

    if (this.buffer.size() >= this.config.batchSize && this.transport) {
      setImmediate(() => {
        this.flush().catch((error) => {
          console.error('[X402Tracer] Failed to flush spans:', error);
        });
      });
    }
  }

  private startAutoFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      if (!this.isShuttingDown && this.buffer.size() > 0) {
        this.flush().catch((error) => {
          console.error('[X402Tracer] Auto-flush failed:', error);
        });
      }
    }, this.config.flushIntervalMs);
  }

  private async sendBatches(spans: SpanData[]): Promise<void> {
    if (!this.transport) {
      return;
    }

    const batches: SpanData[][] = [];
    for (let i = 0; i < spans.length; i += this.config.batchSize) {
      batches.push(spans.slice(i, i + this.config.batchSize));
    }

    const promises = batches.map((batch, index) => {
      const trace: Trace = {
        traceId: this.traceId,
        spans: batch,
        metadata: { ...this.metadata },
      };

      return this.transport!
        .sendTrace(trace)
        .catch((error) => {
          console.error('[X402Tracer] Failed to send trace batch', index, error);
          throw error;
        });
    });

    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error('[X402Tracer] Trace batch rejected', index, result.reason);
      }
    });
    this.traceId = this.generateTraceId();
  }

  private generateTraceId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    try {
      const nodeCrypto = require('crypto');
      if (nodeCrypto.randomUUID) {
        return nodeCrypto.randomUUID();
      }
    } catch {
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  getTraceId(): string {
    return this.traceId;
  }

  getBufferSize(): number {
    return this.buffer.size();
  }

  /**
   * Получить публичный ключ (для регистрации или экспорта)
   */
  async getPublicKey(): Promise<string | null> {
    if (!this.keyManager) {
      return null;
    }
    return this.keyManager.getPublicKey();
  }

  /**
   * Получить приватный ключ (для расшифровки в дашборде)
   */
  async getPrivateKey(): Promise<string | null> {
    if (!this.keyManager) {
      return null;
    }
    return this.keyManager.getPrivateKey();
  }

  /**
   * Публикация анонимных метрик (опционально)
   */
  async publishPublicMetrics(): Promise<void> {
    if (!this.config.publicMetrics?.enabled || !this.transport) {
      return;
    }

    if (this.traceMetrics.count === 0) {
      return;
    }

    const successRate = this.traceMetrics.success / this.traceMetrics.count;
    const avgLatency = this.traceMetrics.totalLatency / this.traceMetrics.count;

    // Генерируем анонимный ID из facilitatorId
    const facilitatorId = this.config.encryption?.facilitatorId || 'unknown';
    const anonymousId = await this.hashFacilitatorId(facilitatorId);

    const metrics: PublicMetrics = {
      facilitatorId: anonymousId,
      successRate,
      avgLatency,
      totalTransactions: this.traceMetrics.count,
      period: '24h', // можно сделать конфигурируемым
      timestamp: Date.now(),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      await fetch(`${this.config.apiUrl}/api/metrics/publish`, {
        method: 'POST',
        headers,
        body: JSON.stringify(metrics),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Сбрасываем метрики после публикации
      this.traceMetrics = { success: 0, error: 0, totalLatency: 0, count: 0 };
    } catch (error) {
      console.error('[X402Tracer] Failed to publish public metrics:', error);
    }
  }

  /**
   * Хеширование facilitator ID для анонимизации
   */
  private async hashFacilitatorId(id: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(id);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } else {
      // Fallback для Node.js
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(id).digest('hex');
        return hash.substring(0, 16);
      } catch {
        return id.substring(0, 16); // Fallback
      }
    }
  }
}
