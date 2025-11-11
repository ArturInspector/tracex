import { useEffect, useState } from 'react';
import type { LiveSpan, SignatureStatusEntry, WalletStateEntry } from './types';

const SIGNATURE_REFRESH_MS = 5_000;
const WALLET_REFRESH_MS = 10_000;

interface UseOnchainTelemetryOptions {
  spans: LiveSpan[];
  apiUrl: string;
  enabled: boolean;
}

interface UseOnchainTelemetryResult {
  signatureStatuses: Record<string, SignatureStatusEntry>;
  walletStates: Record<string, WalletStateEntry>;
  error: string | null;
}

interface SignatureStatusResponse {
  signature: string;
  status: 'processed' | 'confirmed' | 'finalized' | 'not_found';
  slot: number | null;
  confirmations: number | null;
  err: string | null;
  timestamp: string;
}

interface WalletStateResponse {
  address: string;
  lamports: number;
  sol: number;
  slot: number;
  epoch: number;
  timestamp: string;
}

export function useOnchainTelemetry({
  spans,
  apiUrl,
  enabled,
}: UseOnchainTelemetryOptions): UseOnchainTelemetryResult {
  const [signatureStatuses, setSignatureStatuses] = useState<Record<string, SignatureStatusEntry>>({});
  const [walletStates, setWalletStates] = useState<Record<string, WalletStateEntry>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSignatureStatuses({});
      setWalletStates({});
      setError(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || spans.length === 0) {
      return;
    }

    const uniqueSignatures = Array.from(
      new Set(spans.map((span) => span.signature).filter((signature): signature is string => Boolean(signature))),
    );

    const pending = uniqueSignatures.filter((signature) => {
      const existing = signatureStatuses[signature];
      if (!existing) return true;
      return Date.now() - existing.fetchedAt > SIGNATURE_REFRESH_MS;
    });

    if (pending.length === 0) {
      return;
    }

    const controller = new AbortController();

    const fetchStatuses = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/onchain/signatures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatures: pending.slice(0, 64) }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = await response.json();
        const data: SignatureStatusResponse[] = Array.isArray(json.data) ? json.data : [];
        const fetchedAt = Date.now();

        setSignatureStatuses((prev) => {
          const next = { ...prev };
          data.forEach((entry) => {
            next[entry.signature] = { ...entry, fetchedAt };
          });
          return next;
        });
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('[useOnchainTelemetry] signature refresh failed', err);
        setError('Failed to refresh signature statuses');
      }
    };

    fetchStatuses();

    return () => {
      controller.abort();
    };
  }, [enabled, spans, apiUrl, signatureStatuses]);

  useEffect(() => {
    if (!enabled || spans.length === 0) {
      return;
    }

    const uniqueWallets = Array.from(
      new Set(spans.map((span) => span.wallet).filter((wallet): wallet is string => Boolean(wallet))),
    );

    const pending = uniqueWallets.filter((wallet) => {
      const existing = walletStates[wallet];
      if (!existing) return true;
      return Date.now() - existing.fetchedAt > WALLET_REFRESH_MS;
    });

    if (pending.length === 0) {
      return;
    }

    const controller = new AbortController();

    const fetchWallet = async (wallet: string): Promise<WalletStateEntry | null> => {
      try {
        const response = await fetch(`${apiUrl}/api/onchain/wallet?address=${encodeURIComponent(wallet)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = await response.json();
        if (!json.success || !json.data) {
          throw new Error('Wallet telemetry unavailable');
        }

        return { ...(json.data as WalletStateResponse), fetchedAt: Date.now() };
      } catch (err) {
        if (controller.signal.aborted) return null;
        console.error('[useOnchainTelemetry] wallet refresh failed', wallet, err);
        return null;
      }
    };

    const run = async () => {
      const results = await Promise.all(pending.slice(0, 8).map((wallet) => fetchWallet(wallet)));
      const valid = results.filter((entry): entry is WalletStateEntry => Boolean(entry));

      if (valid.length > 0) {
        setWalletStates((prev) => {
          const next = { ...prev };
          valid.forEach((entry) => {
            next[entry.address] = entry;
          });
          return next;
        });
        setError(null);
      } else if (!error) {
        setError('Wallet telemetry unavailable');
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [enabled, spans, apiUrl, walletStates, error]);

  return {
    signatureStatuses,
    walletStates,
    error,
  };
}

