'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DecryptionService, type Trace, type EncryptedTrace } from '@/lib/crypto';

interface TraceViewerProps {
  encryptedTraces: EncryptedTrace[];
  privateKey: string;
  facilitatorId: string;
}

export function TraceViewer({ encryptedTraces, privateKey, facilitatorId }: TraceViewerProps) {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  const decryptionService = useMemo(() => new DecryptionService(), []);

  const summary = useMemo(() => {
    if (traces.length === 0) {
      return {
        totalTraces: 0,
        totalSpans: 0,
        errorRate: 0,
        p95: 0,
        avgLatency: 0,
        throughput: 0,
      };
    }

    let totalSpans = 0;
    let errorSpans = 0;
    const durations: number[] = [];

    for (const trace of traces) {
      const spanCount = trace.spans.length;
      totalSpans += spanCount;

      if (spanCount === 0) {
        continue;
      }

      const startNs = Math.min(...trace.spans.map((span) => span.startTime));
      const endNs = Math.max(...trace.spans.map((span) => span.endTime));
      const durationMs = (endNs - startNs) / 1e6;
      durations.push(durationMs);

      for (const span of trace.spans) {
        if (span.status === 'error') {
          errorSpans += 1;
        }
      }
    }

    durations.sort((a, b) => a - b);
    const percentile = (p: number) => {
      if (durations.length === 0) return 0;
      const idx = Math.min(durations.length - 1, Math.floor((p / 100) * durations.length));
      return durations[idx];
    };

    const totalDurationMs = durations.reduce((acc, d) => acc + d, 0);
    const avgLatency = durations.length === 0 ? 0 : totalDurationMs / durations.length;

    return {
      totalTraces: traces.length,
      totalSpans,
      errorRate: totalSpans === 0 ? 0 : (errorSpans / totalSpans) * 100,
      p95: percentile(95),
      avgLatency,
      throughput:
        totalDurationMs === 0 ? 0 : totalSpans / (totalDurationMs / 1000),
    };
  }, [traces]);

  useEffect(() => {
    const decryptAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const decrypted: Trace[] = [];
        for (const encrypted of encryptedTraces) {
          try {
            const trace = await decryptionService.decryptTrace(encrypted, privateKey);
            decrypted.push(trace);
          } catch (err) {
            console.error('Failed to decrypt trace:', err);
            // Пропускаем нерасшифрованные traces
          }
        }
        setTraces(decrypted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to decrypt traces');
      } finally {
        setLoading(false);
      }
    };

    if (encryptedTraces.length > 0 && privateKey) {
      decryptAll();
    }
  }, [encryptedTraces, privateKey, decryptionService]);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
        <div className="text-center py-8 text-purple-400/50">
          <div className="text-4xl mb-2 font-mono">🔓</div>
          <p>Decrypting traces...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-red-950/50 to-purple-950/50 border-red-500/30 backdrop-blur-sm">
        <div className="text-red-400">{error}</div>
      </Card>
    );
  }

  if (traces.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
        <div className="text-center py-8 text-purple-400/50">
          <div className="text-4xl mb-2 font-mono">[ ]</div>
          <p>No traces found</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-purple-300/60">Facilitator</div>
            <div className="font-mono text-sm text-purple-200">{facilitatorId}</div>
          </div>
          <Badge variant="outline" className="border-purple-500/40 text-purple-200">
            {summary.totalTraces} traces
          </Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Metric value={summary.totalTraces} label="Traces decrypted" suffix="" />
          <Metric value={summary.totalSpans} label="Spans total" suffix="" />
          <Metric value={summary.errorRate} label="Error rate" format="percent" />
          <Metric value={summary.p95} label="p95 latency" suffix="ms" />
          <Metric value={summary.avgLatency} label="Avg trace latency" suffix="ms" />
          <Metric value={summary.throughput} label="Spans/sec (decrypted)" format="rate" />
        </div>
      </Card>
      {/* Список traces */}
      <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-4">
          Traces ({traces.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {traces.map((trace, index) => {
            const totalDuration = trace.spans.reduce((sum, span) => sum + span.duration / 1e6, 0);
            const hasError = trace.spans.some((s) => s.status === 'error');

            return (
              <div
                key={`${trace.traceId}-${index}`}
                onClick={() => setSelectedTrace(trace)}
                className={`p-3 bg-black/30 rounded-lg border cursor-pointer transition-all ${
                  selectedTrace?.traceId === trace.traceId
                    ? 'border-purple-500'
                    : 'border-purple-500/20 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={hasError ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {hasError ? 'ERROR' : 'OK'}
                    </Badge>
                    <span className="text-purple-300 font-mono text-sm">
                      {trace.traceId.substring(0, 8)}...
                    </span>
                  </div>
                  <span className="text-purple-400/70 text-sm">
                    {totalDuration.toFixed(2)}ms
                  </span>
                </div>
                <div className="text-xs text-purple-400/60 mt-1">
                  {trace.spans.length} spans
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Детали выбранного trace */}
      {selectedTrace && (
        <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Trace Details</h3>
            <Button
              variant="outline"
              onClick={() => setSelectedTrace(null)}
              className="border-purple-500/50 text-purple-300"
            >
              Close
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-purple-400/70 mb-1">Trace ID</div>
              <div className="font-mono text-sm text-white">{selectedTrace.traceId}</div>
            </div>

            {/* Waterfall chart */}
            <div>
              <div className="text-sm text-purple-400/70 mb-2">Timeline</div>
              <div className="space-y-2">
                {selectedTrace.spans.map((span, index) => {
                  const startTime = span.startTime / 1e6;
                  const duration = span.duration / 1e6;
                  const firstSpanStart = selectedTrace.spans[0].startTime / 1e6;
                  const relativeStart = startTime - firstSpanStart;
                  const totalDuration = Math.max(
                    ...selectedTrace.spans.map((s) => (s.endTime - selectedTrace.spans[0].startTime) / 1e6)
                  );
                  const widthPercent = (duration / totalDuration) * 100;
                  const leftPercent = (relativeStart / totalDuration) * 100;

                  return (
                    <div key={index} className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-purple-300 w-32 truncate">{span.name}</span>
                        <Badge
                          variant={span.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {span.status}
                        </Badge>
                        <span className="text-xs text-purple-400/70">{duration.toFixed(2)}ms</span>
                      </div>
                      <div className="relative h-6 bg-black/30 rounded overflow-hidden">
                        <div
                          className={`absolute h-full ${
                            span.status === 'success' ? 'bg-green-500/50' : 'bg-red-500/50'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                        />
                      </div>
                      {span.error && (
                        <div className="mt-1 text-xs text-red-400 ml-32">
                          {span.error.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata */}
            {Object.keys(selectedTrace.metadata).length > 0 && (
              <div>
                <div className="text-sm text-purple-400/70 mb-2">Metadata</div>
                <div className="bg-black/30 rounded p-3 font-mono text-xs">
                  <pre className="text-purple-200">
                    {JSON.stringify(selectedTrace.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

interface MetricProps {
  value: number;
  label: string;
  suffix?: string;
  format?: 'percent' | 'rate';
}

function Metric({ value, label, suffix = '', format }: MetricProps) {
  const formatter = () => {
    if (!Number.isFinite(value)) {
      return '–';
    }

    const base = Number.isInteger(value) ? value.toString() : value.toFixed(1);

    if (format === 'percent') {
      return `${Number.parseFloat(base).toFixed(1)}%`;
    }

    if (format === 'rate') {
      return `${base}`;
    }

    return `${base}${suffix}`;
  };

  return (
    <div className="min-w-[160px] flex-1">
      <div className="text-2xl font-semibold text-white">
        {formatter()}
      </div>
      <div className="text-xs uppercase tracking-wide text-purple-300/60 mt-1">
        {label}
      </div>
    </div>
  );
}


