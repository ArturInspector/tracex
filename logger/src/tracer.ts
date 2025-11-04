import { Span } from './span.js';
import { CircularBuffer } from './buffer.js';
import { Transport } from './transport.js';
import type {
  TraceConfig,
  TraceMetadata,
  SpanData,
  Trace,
} from './types.js';

export class X402Tracer {
  private readonly config: Required<Omit<TraceConfig, 'apiKey' | 'apiUrl'>> & {
    apiKey?: string;
    apiUrl?: string;
  };
  private readonly buffer: CircularBuffer;
  private readonly transport: Transport | null;
  private readonly metadata: TraceMetadata;
  private traceId: string;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isShuttingDown = false;

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
    if (this.config.apiUrl) {
      this.transport = new Transport({
        apiUrl: this.config.apiUrl,
        apiKey: this.config.apiKey,
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

    const promises = batches.map((batch) => {
      const trace: Trace = {
        traceId: this.traceId,
        spans: batch,
        metadata: { ...this.metadata },
      };

      return this.transport!.sendTrace(trace);
    });

    await Promise.allSettled(promises);
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
}
