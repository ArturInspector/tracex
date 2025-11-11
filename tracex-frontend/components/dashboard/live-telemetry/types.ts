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

export const signatureBadgeStyles: Record<SignatureStatusEntry['status'], string> = {
  processed: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  finalized: 'bg-green-500/20 text-green-300 border-green-500/20',
  not_found: 'bg-purple-500/20 text-purple-200 border-purple-500/20',
};

export function shorten(value: string, prefix = 4, suffix = 4): string {
  if (value.length <= prefix + suffix + 3) {
    return value;
  }
  return `${value.slice(0, prefix)}…${value.slice(-suffix)}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms >= 1) return `${ms.toFixed(1)}ms`;
  return `${ms.toFixed(3)}ms`;
}

export function formatRelative(timestamp: number | null): string {
  if (!timestamp) return 'never';
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 1_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(timestamp).toLocaleTimeString();
}

export function clusterLabel(cluster?: string | null): string {
  if (!cluster) return 'unknown cluster';
  const lower = cluster.toLowerCase();
  if (lower.includes('devnet')) return 'Solana Devnet';
  if (lower.includes('testnet')) return 'Solana Testnet';
  if (lower.includes('mainnet')) return 'Solana Mainnet';
  if (lower.includes('base')) return 'Base';
  return cluster;
}

export function signatureExplorer(signature: string, cluster?: string | null): string {
  const base = 'https://solscan.io/tx/';
  if (!cluster) return `${base}${signature}`;
  const lower = cluster.toLowerCase();
  if (lower.includes('devnet')) return `${base}${signature}?cluster=devnet`;
  if (lower.includes('testnet')) return `${base}${signature}?cluster=testnet`;
  return `${base}${signature}`;
}

export function walletExplorer(address: string, cluster?: string | null): string {
  const base = 'https://solscan.io/account/';
  if (!cluster) return `${base}${address}`;
  const lower = cluster.toLowerCase();
  if (lower.includes('devnet')) return `${base}${address}?cluster=devnet`;
  if (lower.includes('testnet')) return `${base}${address}?cluster=testnet`;
  return `${base}${address}`;
}

export function getStringAttribute(
  attributes: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = attributes?.[key];
  return typeof value === 'string' ? value : undefined;
}

