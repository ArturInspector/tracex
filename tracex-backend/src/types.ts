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
  tags?: string[];
}

export interface PublicMetrics {
  facilitatorId: string;
  successRate: number;
  avgLatency: number;
  totalTransactions: number;
  period: string;
  timestamp: number;
}

export interface OnchainWalletState {
  address: string;
  lamports: number;
  sol: number;
  slot: number;
  epoch: number;
  timestamp: string;
}

export interface OnchainSignatureStatus {
  signature: string;
  status: 'processed' | 'confirmed' | 'finalized' | 'not_found';
  slot: number | null;
  confirmations: number | null;
  err: string | null;
  timestamp: string;
}

