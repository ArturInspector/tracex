import { Badge } from '@/components/ui/badge';
import type { LiveSpan, SignatureStatusEntry } from './types';
import {
  clusterLabel,
  formatDuration,
  signatureBadgeStyles,
  signatureExplorer,
  shorten,
  walletExplorer,
} from './types';

interface LiveSpanFeedProps {
  spans: LiveSpan[];
  signatureStatuses: Record<string, SignatureStatusEntry>;
  activeCluster: string | null;
  enabled: boolean;
}

export function LiveSpanFeed({
  spans,
  signatureStatuses,
  activeCluster,
  enabled,
}: LiveSpanFeedProps) {
  if (spans.length === 0) {
    return (
      <div className="text-center py-10 text-purple-400/60">
        <div className="text-4xl mb-2 font-mono">[ waiting ]</div>
        <p>
          {enabled
            ? 'Feed will light up as soon as new spans arrive.'
            : 'Provide facilitator ID and decrypt key to start streaming.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1.5">
      {spans.map((span) => {
        const signatureStatus = span.signature
          ? signatureStatuses[span.signature]
          : undefined;

        return (
          <div
            key={span.id}
            className="p-3 bg-black/30 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors font-mono text-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={span.status === 'success' ? 'default' : 'destructive'}
                  className="text-xs uppercase"
                >
                  {span.status === 'success' ? 'OK' : 'ERR'}
                </Badge>

                {signatureStatus && (
                  <Badge
                    variant="outline"
                    className={`text-xs uppercase tracking-wide ${signatureBadgeStyles[signatureStatus.status]}`}
                  >
                    {signatureStatus.status}
                  </Badge>
                )}

                {span.cluster && (
                  <Badge
                    variant="outline"
                    className="text-xs border-purple-500/30 text-purple-200"
                  >
                    {clusterLabel(span.cluster)}
                  </Badge>
                )}

                {span.rpc && (
                  <Badge
                    variant="outline"
                    className="text-xs border-cyan-400/30 text-cyan-200"
                  >
                    {shorten(span.rpc, 8, 6)}
                  </Badge>
                )}
              </div>
              <span className="text-purple-400/70">
                {formatDuration(span.durationMs)}
              </span>
            </div>

            <div className="text-white text-base">{span.name}</div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-purple-300/70">
              <span>Trace {shorten(span.traceId, 6, 4)}</span>
              <span>•</span>
              <span>{new Date(span.timestampMs).toLocaleTimeString()}</span>
              {span.signature && (
                <>
                  <span>•</span>
                  <a
                    href={signatureExplorer(span.signature, activeCluster)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    Sig {shorten(span.signature, 8, 6)}
                  </a>
                </>
              )}
              {span.wallet && (
                <>
                  <span>•</span>
                  <a
                    href={walletExplorer(span.wallet, activeCluster)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    Wallet {shorten(span.wallet, 6, 4)}
                  </a>
                </>
              )}
            </div>

            {span.errorMessage && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                {span.errorMessage}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

