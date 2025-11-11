import type { SpanData, Trace, EncryptedTrace } from './types.js';
import { EncryptionService } from './crypto/encryption.js';
import type { KeyManager } from './crypto/key-manager.js';

export interface TransportConfig {
  apiUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  encryptionEnabled?: boolean;
  keyManager?: KeyManager;
  facilitatorId?: string;
}

export class Transport {
  private readonly config: Required<Omit<TransportConfig, 'apiKey' | 'keyManager'>> & {
    apiKey?: string;
    keyManager?: KeyManager;
  };
  private readonly encryptionService: EncryptionService;
  private publicKeyRegistered: boolean = false;

  constructor(config: TransportConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      timeoutMs: config.timeoutMs ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      encryptionEnabled: config.encryptionEnabled ?? false,
      facilitatorId: config.facilitatorId ?? '',
      apiKey: config.apiKey,
      keyManager: config.keyManager,
    };
    this.encryptionService = new EncryptionService();
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
    // Регистрируем публичный ключ если нужно
    if (this.config.encryptionEnabled && this.config.keyManager && !this.publicKeyRegistered) {
      await this.registerPublicKey();
    }

    // Шифруем trace если включено шифрование
    if (this.config.encryptionEnabled && this.config.keyManager) {
      const publicKey = await this.config.keyManager.getPublicKey();
      const encryptedTrace = await this.encryptionService.encryptTrace(
        trace,
        publicKey,
        this.config.facilitatorId
      );
      await this.sendWithRetryEncrypted(encryptedTrace);
    } else {
      await this.sendWithRetry(trace);
    }
  }

  /**
   * Регистрация публичного ключа на сервере
   */
  private async registerPublicKey(): Promise<void> {
    if (!this.config.keyManager) {
      return;
    }

    try {
      const publicKey = await this.config.keyManager.getPublicKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.apiUrl}/api/keys/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          facilitatorId: this.config.facilitatorId,
          publicKey: publicKey,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.publicKeyRegistered = true;
      } else {
        console.warn('[Transport] Failed to register public key:', response.statusText);
      }
    } catch (error) {
      console.warn('[Transport] Failed to register public key:', error);
      // Не блокируем отправку traces из-за ошибки регистрации
    }
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

  private async sendWithRetryEncrypted(encryptedTrace: EncryptedTrace): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        await this.sendEncryptedRequest(encryptedTrace);
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

    throw lastError || new Error('Failed to send encrypted trace after retries');
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

      const response = await fetch(`${this.config.apiUrl}/api/traces`, {
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

  private async sendEncryptedRequest(encryptedTrace: EncryptedTrace): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      console.debug(
        '[Transport] Sending encrypted trace',
        {
          traceId: encryptedTrace.traceId,
          facilitatorId: encryptedTrace.facilitatorId,
          apiUrl: this.config.apiUrl,
        }
      );

      const response = await fetch(`${this.config.apiUrl}/api/traces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(encryptedTrace),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send encrypted trace: ${response.status} ${response.statusText}`
        );
      }
      console.debug('[Transport] Trace sent successfully');
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
