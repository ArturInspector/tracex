import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLiveSpanFeed } from './live-telemetry/use-live-span-feed';
import { useOnchainTelemetry } from './live-telemetry/use-onchain-telemetry';
import { LiveSpanFeed } from './live-telemetry/live-span-feed';
import { OnchainInsights } from './live-telemetry/onchain-insights';
import { clusterLabel, formatRelative } from './live-telemetry/types';

interface LiveTelemetryProps {
  facilitatorId: string;
  privateKey: string;
  apiUrl: string;
  enabled: boolean;
}

export function LiveTelemetry({ facilitatorId, privateKey, apiUrl, enabled }: LiveTelemetryProps) {
  const {
    spans,
    lastUpdate,
    isFetching,
    error: connectionError,
    reset,
  } = useLiveSpanFeed({ facilitatorId, privateKey, apiUrl, enabled });

  const {
    signatureStatuses,
    walletStates,
    error: onchainError,
  } = useOnchainTelemetry({ spans, apiUrl, enabled });

  const collectorHost = useMemo(() => {
    try {
      const url = new URL(apiUrl);
      return url.host;
    } catch {
      return apiUrl;
    }
  }, [apiUrl]);

  const activeCluster = useMemo(
    () => spans.find((span) => span.cluster)?.cluster ?? null,
    [spans],
  );

  const walletEntries = useMemo(() => {
    return Object.values(walletStates)
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .slice(0, 4);
  }, [walletStates]);

  return (
    <Card className="p-6 md:p-8 bg-gradient-to-br from-purple-950/60 via-blue-950/50 to-cyan-950/40 border-purple-500/20 backdrop-blur-md space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              enabled ? 'bg-green-400 animate-ping' : 'bg-cyan-400/70',
            )}
          />
          <h3 className="text-2xl font-bold text-white">Live On-chain Telemetry</h3>
        </div>
        <Badge variant="outline" className="border-purple-400 text-purple-200">
          Facilitator stream
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-purple-300/70">
        <span>
          Status{' '}
          <span className={enabled ? 'text-green-300' : 'text-purple-300/80'}>
            {enabled ? (isFetching ? 'refreshing' : 'streaming') : 'idle'}
          </span>
        </span>
        <span>Collector: {collectorHost}</span>
        {activeCluster && <span>Cluster: {clusterLabel(activeCluster)}</span>}
        <span>Last update: {formatRelative(lastUpdate)}</span>
        {connectionError && <span className="text-red-300">• {connectionError}</span>}
        {onchainError && !connectionError && <span className="text-amber-300">• {onchainError}</span>}
      </div>

      <LiveSpanFeed
        spans={spans}
        signatureStatuses={signatureStatuses}
        activeCluster={activeCluster}
        enabled={enabled}
      />

      <OnchainInsights
        wallets={walletEntries}
        activeCluster={activeCluster}
        error={onchainError}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!enabled}
          onClick={reset}
          className="border-purple-500/40 text-purple-200"
        >
          Clear feed
        </Button>
      </div>
    </Card>
  );
}

