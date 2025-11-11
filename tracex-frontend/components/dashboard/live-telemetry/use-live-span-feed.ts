import { useEffect, useMemo, useRef, useState } from 'react';
import { DecryptionService, type EncryptedTrace } from '@/lib/crypto';
import { getStringAttribute, type LiveSpan } from './types';

const TRACE_FETCH_LIMIT = 40;
const TRACE_POLL_INTERVAL_MS = 3_500;
const MAX_LOG_ITEMS = 60;

interface ApiEncryptedTracePayload extends Partial<EncryptedTrace> {
  trace_id?: string;
  facilitator_id?: string;
  encrypted_data?: string;
  aes_key_encrypted?: string;
  createdAt?: string | number;
}

interface UseLiveSpanFeedOptions {
  facilitatorId: string;
  privateKey: string;
  apiUrl: string;
  enabled: boolean;
}

interface UseLiveSpanFeedResult {
  spans: LiveSpan[];
  lastUpdate: number | null;
  isFetching: boolean;
  error: string | null;
  reset: () => void;
}

export function useLiveSpanFeed({
  facilitatorId,
  privateKey,
  apiUrl,
  enabled,
}: UseLiveSpanFeedOptions): UseLiveSpanFeedResult {
  const [spans, setSpans] = useState<LiveSpan[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const seenSpanIds = useRef<Set<string>>(new Set());
  const decryptionService = useMemo(() => new DecryptionService(), []);

  const reset = () => {
    seenSpanIds.current.clear();
    setSpans([]);
    setError(null);
    setLastUpdate(null);
  };

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, facilitatorId, privateKey]);

  useEffect(() => {
    if (!enabled || !facilitatorId || !privateKey) {
      setIsFetching(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(
          `${apiUrl}/api/traces?facilitatorId=${encodeURIComponent(facilitatorId)}&limit=${TRACE_FETCH_LIMIT}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to load traces (${response.status})`);
        }

        const json = await response.json();
        const entries: ApiEncryptedTracePayload[] = Array.isArray(json.data) ? json.data : [];

        const normalised = entries
          .map<EncryptedTrace | null>((trace) => {
            const traceId = trace.traceId ?? trace.trace_id;
            const encryptedData = trace.encryptedData ?? trace.encrypted_data;
            const aesKeyEncrypted = trace.aesKeyEncrypted ?? trace.aes_key_encrypted;
            const iv = trace.iv;

            if (!traceId || !encryptedData || !aesKeyEncrypted || !iv) {
              return null;
            }

            const timestamp =
              typeof trace.timestamp === 'number'
                ? trace.timestamp
                : trace.createdAt
                  ? new Date(trace.createdAt).getTime()
                  : Date.now();

            return {
              traceId,
              facilitatorId: trace.facilitatorId ?? trace.facilitator_id,
              encryptedData,
              aesKeyEncrypted,
              iv,
              timestamp,
            };
          })
          .filter((trace): trace is EncryptedTrace => trace !== null);

        const decrypted = await Promise.allSettled(
          normalised.map((trace) =>
            decryptionService.decryptTrace(
              {
                traceId: trace.traceId,
                encryptedData: trace.encryptedData,
                aesKeyEncrypted: trace.aesKeyEncrypted,
                iv: trace.iv,
                timestamp: trace.timestamp ?? Date.now(),
              },
              privateKey,
            ),
          ),
        );

        const nextSpans: LiveSpan[] = [];
        let decryptErrors = 0;

        decrypted.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            decryptErrors += 1;
            return;
          }

          const trace = result.value;
          if (!trace.spans?.length) {
            return;
          }

          const envelope = normalised[index];
          const baseTimestamp = envelope.timestamp ?? Date.now();
          const firstSpanStart = Math.min(...trace.spans.map((span) => span.startTime));

          trace.spans.forEach((span) => {
            const spanId = `${trace.traceId}:${span.name}:${span.startTime}`;
            if (seenSpanIds.current.has(spanId)) {
              return;
            }

            seenSpanIds.current.add(spanId);

            const relativeStartMs = (span.startTime - firstSpanStart) / 1e6;
            const timestampMs = baseTimestamp + relativeStartMs;
            const signature =
              getStringAttribute(span.attributes, 'signature') ??
              getStringAttribute(trace.metadata, 'signature');
            const wallet =
              getStringAttribute(span.attributes, 'wallet') ??
              getStringAttribute(trace.metadata, 'wallet');
            const cluster =
              getStringAttribute(span.attributes, 'cluster') ??
              getStringAttribute(trace.metadata, 'cluster');
            const rpc =
              getStringAttribute(span.attributes, 'rpc') ??
              getStringAttribute(trace.metadata, 'rpc');

            nextSpans.push({
              id: spanId,
              traceId: trace.traceId,
              name: span.name,
              status: span.status,
              durationMs: span.duration / 1e6,
              timestampMs,
              signature: signature ?? undefined,
              wallet: wallet ?? undefined,
              cluster: cluster ?? undefined,
              rpc: rpc ?? undefined,
              errorMessage: span.error?.message,
            });
          });
        });

        if (!cancelled) {
          if (decrypted.length > 0 && decryptErrors === decrypted.length) {
            throw new Error('Unable to decrypt traces. Check private key.');
          }

          if (nextSpans.length > 0) {
            nextSpans.sort((a, b) => b.timestampMs - a.timestampMs);
            setSpans((prev) => {
              const merged = [...nextSpans, ...prev];
              merged.sort((a, b) => b.timestampMs - a.timestampMs);
              return merged.slice(0, MAX_LOG_ITEMS);
            });
          }

          setError(null);
          setLastUpdate(Date.now());
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to refresh live telemetry';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
          timer = setTimeout(run, TRACE_POLL_INTERVAL_MS);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, facilitatorId, privateKey, apiUrl, decryptionService]);

  return {
    spans,
    lastUpdate,
    isFetching,
    error,
    reset,
  };
}

