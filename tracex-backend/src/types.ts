/**
 * Типы для TraceX Backend
 */

export interface EncryptedTrace {
  traceId: string;
  facilitatorId?: string;
  encryptedData: string;
  aesKeyEncrypted: string;
  iv: string;
  timestamp: number;
}

export interface PublicMetrics {
  facilitatorId: string;
  successRate: number;
  avgLatency: number;
  totalTransactions: number;
  period: string;
  timestamp: number;
}

