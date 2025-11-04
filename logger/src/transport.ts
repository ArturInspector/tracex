import type { SpanData, Trace } from './types.js';

export interface TransportConfig {
  apiUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class Transport {
  private readonly config: Required<Omit<TransportConfig, 'apiKey'>> & {
    apiKey?: string;
  };

  constructor(config: TransportConfig) {
    this.config = {
      timeoutMs: 30000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config,
      apiUrl: config.apiUrl,
    };
  }

  async sendBatch(spans: SpanData[]): Promise<void> {
    if (spans.length === 0) {
      return;
    }

    const trace: Trace = {
      traceId: this.generateTraceId(),
      spans,
      metadata: {},
    };

    await this.sendWithRetry(trace);
  }

  async sendTrace(trace: Trace): Promise<void> {
    await this.sendWithRetry(trace);
  }

  private async sendWithRetry(trace: Trace): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        await this.sendRequest(trace);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.config.retryAttempts - 1) {
          throw lastError;
        }

        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Failed to send trace after retries');
  }

  private async sendRequest(trace: Trace): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(trace),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send trace: ${response.status} ${response.statusText}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
