export type SpanStatus = 'success' | 'error';

export interface ErrorData {
  message: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

export interface TraceMetadata {
  agentId?: string;
  facilitator?: string;
  cost?: number;
  rpc?: string;
  [key: string]: unknown;
}

export interface SpanData {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: SpanStatus;
  error?: ErrorData;
  attributes?: Record<string, unknown>;
}

export interface Trace {
  traceId: string;
  spans: SpanData[];
  metadata: TraceMetadata;
}

export interface TraceConfig {
  apiUrl?: string;
  apiKey?: string;
  bufferSize?: number;
  batchSize?: number;
  flushIntervalMs?: number;
  autoFlush?: boolean;
  metadata?: TraceMetadata;
  
  // Шифрование
  encryption?: {
    enabled: boolean;
    keysPath?: string; // путь к файлу с ключами
    facilitatorId?: string; // идентификатор facilitator'а
  };
  
  // Публичные метрики
  publicMetrics?: {
    enabled: boolean; // опциональная публикация анонимных метрик
  };
}

export interface EncryptedTrace {
  traceId: string;
  facilitatorId?: string;
  encryptedData: string; // Base64 зашифрованные данные
  aesKeyEncrypted: string; // Base64 зашифрованный AES ключ
  iv: string; // Base64 initialization vector
  timestamp: number;
}

export interface PublicMetrics {
  facilitatorId: string; // анонимный ID (hash)
  successRate: number; // 0-1
  avgLatency: number; // миллисекунды
  totalTransactions: number;
  period: string; // период (например, "24h", "7d")
  timestamp: number;
}

export interface KeyPair {
  publicKey: string; // PEM формат
  privateKey: string; // PEM формат
}
