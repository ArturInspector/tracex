import { useEffect, useMemo, useRef, useState } from 'react';
import { DecryptionService, type EncryptedTrace } from '@/lib/crypto';
import type {
  LiveSpan,
  SignatureStatusEntry,
  WalletStateEntry,
  LiveTelemetryErrors,
  LiveTelemetryStats,
} from './types';

const TRACE_FETCH_LIMIT = 50;
const MAX_SPANS = 80;
const TRACE_POLL_MS = 4_000;
const SIGNATURE_REFRESH_MS = 6_000;
const WALLET_REFRESH_MS = 10_000;
const SIGNATURE_BATCH_LIMIT = 64;
const WALLET_BATCH_LIMIT = 8;

interface ApiTrace extends EncryptedTrace {
  createdAt?: string | number;
  trace_id?: string;
  encrypted_data?: string;
  aes_key_encrypted?: string;
}

interface TraceFetchResult {
  spans: LiveSpan[];
  total: number;
  decryptErrors: number;
}

export interface LiveTelemetryOptions {
  enabled: boolean;
  facilitatorId: string;
  privateKey: string;
  apiUrl: string;
}

export interface LiveTelemetryResult {
  spans: LiveSpan[];
  signatureStatuses: Record<string, SignatureStatusEntry>;
  walletStates: Record<string, WalletStateEntry>;
  stats: LiveTelemetryStats;
  errors: LiveTelemetryErrors;
  lastUpdate: number | null;
  isFetching: boolean;
  clear(): void;
}

const decryptionService = new DecryptionService();

export function useLiveTelemetry({
  enabled,
  facilitatorId,
  privateKey,
  apiUrl,
}: LiveTelemetryOptions): LiveTelemetryResult {
  const [spans, setSpans] = useState<LiveSpan[]>([]);
  const [signatureStatuses, setSignatureStatuses] = useState<Record<string, SignatureStatusEntry>>({});
  const [walletStates, setWalletStates] = useState<Record<string, WalletStateEntry>>({});
  const [errors, setErrors] = useState<LiveTelemetryErrors>({});
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const seenSpanIdsRef = useRef<Set<string>>(new Set());

  const clear = () => {
    seenSpanIdsRef.current.clear();
    setSpans([]);
    setSignatureStatuses({});
    setWalletStates({});
    setErrors({});
    setLastUpdate(null);
  };

  useEffect(() => {
    clear();
  }, [facilitatorId, privateKey]);

  useEffect(() => {
    if (!enabled || !facilitatorId || !privateKey) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      try {
        setIsFetching(true);
        const result = await fetchAndDecrypt({
          apiUrl,
          facilitatorId,
          privateKey,
        });

        if (cancelled) {
          return;
        }

        if (result.spans.length > 0) {
          const freshSpans = result.spans.filter((span) => {
            if (seenSpanIdsRef.current.has(span.id)) {
              return false;
            }
            seenSpanIdsRef.current.add(span.id);
            return true;
          });

          if (freshSpans.length > 0) {
            setSpans((prev) => {
              const merged = [...freshSpans, ...prev];
            merged.sort((a, b) => b.timestampMs - a.timestampMs);
            return merged.slice(0, MAX_SPANS);
            });
            setLastUpdate(Date.now());
            setErrors((prev) => ({ ...prev, decrypt: undefined, connection: undefined }));
          }
        }

        if (result.total > 0 && result.decryptErrors === result.total) {
          setErrors((prev) => ({
            ...prev,
            decrypt: 'Unable to decrypt traces. Check that the private key matches the facilitator.',
          }));
        } else if (result.decryptErrors > 0) {
          setErrors((prev) => ({
            ...prev,
            decrypt: 'Some traces failed to decrypt due to key rotation.',
          }));
        } else {
          setErrors((prev) => ({ ...prev, decrypt: undefined }));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load traces';
          setErrors((prev) => ({ ...prev, connection: message }));
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
          timer = setTimeout(run, TRACE_POLL_MS);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [enabled, apiUrl, facilitatorId, privateKey]);

  useEffect(() => {
    if (!enabled || spans.length === 0) {
      return;
    }

    const uniqueSignatures = Array.from(
      new Set(spans.map((span) => span.signature).filter(Boolean) as string[]),
    );

    const pending = uniqueSignatures
      .filter((signature) => {
        const entry = signatureStatuses[signature];
        if (!entry) return true;
        return Date.now() - entry.fetchedAt > SIGNATURE_REFRESH_MS;
      })
      .slice(0, SIGNATURE_BATCH_LIMIT);

    if (pending.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/onchain/signatures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatures: pending }),
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh signature statuses (${response.status})`);
        }

        const json = await response.json();
        const entries = Array.isArray(json.data) ? json.data : [];
        const fetchedAt = Date.now();

        if (!cancelled) {
          setSignatureStatuses((prev) => {
            const next = { ...prev };
            entries.forEach((entry: SignatureStatusEntry) => {
              next[entry.signature] = { ...entry, fetchedAt };
            });
            return next;
          });
          setErrors((prev) => ({ ...prev, onchain: undefined }));
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Failed to refresh signature statuses';
          setErrors((prev) => ({ ...prev, onchain: message }));
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, spans, apiUrl, signatureStatuses]);

  useEffect(() => {
    if (!enabled || spans.length === 0) {
      return;
    }

    const uniqueWallets = Array.from(
      new Set(spans.map((span) => span.wallet).filter(Boolean) as string[]),
    );

    const pending = uniqueWallets
      .filter((wallet) => {
        const entry = walletStates[wallet];
        if (!entry) return true;
        return Date.now() - entry.fetchedAt > WALLET_REFRESH_MS;
      })
      .slice(0, WALLET_BATCH_LIMIT);

    if (pending.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const results = await Promise.all(
        pending.map(async (wallet) => {
          try {
            const response = await fetch(
              `${apiUrl}/api/onchain/wallet?address=${encodeURIComponent(wallet)}`,
            );

            if (!response.ok) {
              throw new Error(`Wallet ${wallet} responded with ${response.status}`);
            }

            const json = await response.json();
            if (!json.success || !json.data) {
              throw new Error(`Wallet ${wallet} missing data`);
            }

            const fetchedAt = Date.now();
            return { ...(json.data as WalletStateEntry), fetchedAt };
          } catch (error) {
            console.error('Failed to fetch wallet state', wallet, error);
            return null;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const valid = results.filter((entry): entry is WalletStateEntry => Boolean(entry));
      if (valid.length > 0) {
        setWalletStates((prev) => {
          const next = { ...prev };
          valid.forEach((entry) => {
            next[entry.address] = entry;
          });
          return next;
        });
        setErrors((prev) => ({ ...prev, onchain: undefined }));
      }
    };

    run().catch((error) => {
      console.error('Unexpected wallet telemetry error', error);
      setErrors((prev) => ({
        ...prev,
        onchain: 'Failed to refresh wallet telemetry',
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, spans, apiUrl, walletStates]);

  const stats = useMemo<LiveTelemetryStats>(() => {
    const uniqueSignatures = new Set<string>();
    const uniqueWallets = new Set<string>();

    spans.forEach((span) => {
      if (span.signature) uniqueSignatures.add(span.signature);
      if (span.wallet) uniqueWallets.add(span.wallet);
    });

    return {
      totalSpans: spans.length,
      uniqueSignatures: uniqueSignatures.size,
      uniqueWallets: uniqueWallets.size,
    };
  }, [spans]);

  return {
    spans,
    signatureStatuses,
    walletStates,
    stats,
    errors,
    lastUpdate,
    isFetching,
    clear,
  };
}

async function fetchAndDecrypt({
  apiUrl,
  facilitatorId,
  privateKey,
}: {
  apiUrl: string;
  facilitatorId: string;
  privateKey: string;
}): Promise<TraceFetchResult> {
  const response = await fetch(
    `${apiUrl}/api/traces?facilitatorId=${encodeURIComponent(facilitatorId)}&limit=${TRACE_FETCH_LIMIT}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load traces (${response.status})`);
  }

  const json = await response.json();
  const items: ApiTrace[] = Array.isArray(json.data) ? json.data : [];

  const normalized = items.map((item) => {
    const timestamp =
      typeof item.timestamp === 'number'
        ? item.timestamp
        : item.createdAt
          ? new Date(item.createdAt).getTime()
          : Date.now();

    const traceId =
      item.traceId ??
      item.trace_id ??
      (typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`);

    return {
      traceId,
      encryptedData: item.encryptedData ?? item.encrypted_data,
      aesKeyEncrypted: item.aesKeyEncrypted ?? item.aes_key_encrypted,
      iv: item.iv,
      timestamp,
    } satisfies EncryptedTrace & { timestamp: number };
  });

  const decryptResults = await Promise.allSettled(
    normalized.map((trace) =>
      decryptionService.decryptTrace(
        {
          traceId: trace.traceId,
          encryptedData: trace.encryptedData,
          aesKeyEncrypted: trace.aesKeyEncrypted,
          iv: trace.iv,
          timestamp: trace.timestamp,
        },
        privateKey,
      ),
    ),
  );

  const spans: LiveSpan[] = [];
  let decryptErrors = 0;

  decryptResults.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      decryptErrors += 1;
      return;
    }

    const trace = result.value;
    const envelope = normalized[index];

    if (!trace.spans || trace.spans.length === 0) {
      return;
    }

    const firstStart = Math.min(...trace.spans.map((span) => span.startTime));
    trace.spans.forEach((span) => {
      const relativeStartMs = (span.startTime - firstStart) / 1e6;
      const timestampMs = envelope.timestamp + relativeStartMs;
      const attributes = span.attributes ?? {};

      spans.push({
        id: `${trace.traceId}:${span.name}:${span.startTime}`,
        traceId: trace.traceId,
        name: span.name,
        status: span.status,
        durationMs: span.duration / 1e6,
        timestampMs,
        signature: extractAttribute(attributes, trace.metadata, 'signature'),
        wallet: extractAttribute(attributes, trace.metadata, 'wallet'),
        cluster: extractAttribute(attributes, trace.metadata, 'cluster'),
        rpc: extractAttribute(attributes, trace.metadata, 'rpc'),
        errorMessage: span.error?.message,
      });
    });
  });

  spans.sort((a, b) => b.timestampMs - a.timestampMs);

  return {
    spans,
    total: decryptResults.length,
    decryptErrors,
  };
}

function extractAttribute(
  attributes: Record<string, unknown>,
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const attr = attributes[key];
  if (typeof attr === 'string' && attr.trim()) {
    return attr;
  }
  const meta = metadata?.[key];
  if (typeof meta === 'string' && meta.trim()) {
    return meta;
  }
  return undefined;
}

