export interface LiveSpan {
  id: string;
  traceId: string;
  name: string;
  status: 'success' | 'error';
  durationMs: number;
  timestampMs: number;
  signature?: string;
  wallet?: string;
  cluster?: string;
  rpc?: string;
  errorMessage?: string;
}

export interface SignatureStatusEntry {
  signature: string;
  status: 'processed' | 'confirmed' | 'finalized' | 'not_found';
  slot: number | null;
  confirmations: number | null;
  err: string | null;
  timestamp: string;
  fetchedAt: number;
}

export interface WalletStateEntry {
  address: string;
  lamports: number;
  sol: number;
  slot: number;
  epoch: number;
  timestamp: string;
  fetchedAt: number;
}

export interface LiveTelemetryErrors {
  connection?: string;
  decrypt?: string;
  onchain?: string;
}

export interface LiveTelemetryStats {
  totalSpans: number;
  uniqueSignatures: number;
  uniqueWallets: number;
}

