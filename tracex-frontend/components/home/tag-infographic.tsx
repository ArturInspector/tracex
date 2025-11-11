import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TagInsight {
  tag: string;
  count: number;
  lastSeenAt: string;
}

function formatAgo(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function GradientBar({ share }: { share: number }) {
  const width = Math.max(5, Math.round(share * 100));
  return (
    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400"
        style={{ width: `${Math.min(width, 100)}%` }}
      />
    </div>
  );
}

export function TagInfographic() {
  const [data, setData] = useState<TagInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch('/api/traces/tags?limit=6', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to load tags (${response.status})`);
        }

        const payload = await response.json();
        setData(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to fetch tag summary:', error);
          setIsError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, []);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);

  return (
    <section className="relative z-10 px-4 py-24">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-[#070B19]/70 border border-purple-500/25 backdrop-blur-2xl p-6 sm:p-9 md:p-12 shadow-[0_40px_90px_rgba(88,28,135,0.28)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div>
              <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-500/40 uppercase tracking-[0.3em]">
                Live tags
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white mt-3">
                Payment flows at a glance
              </h3>
              <p className="text-sm sm:text-base text-purple-100/70 mt-3 max-w-2xl">
                X-Tag-X headers condensed into a visual pulse of your payment telemetry.
              </p>
            </div>
            <Badge variant="outline" className="border-purple-400/40 text-purple-200">
              {total > 0 ? `${total} tracked spans` : 'Waiting for spans'}
            </Badge>
          </div>

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && isError && null}

          {!isLoading && !isError && data.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-purple-100/70">Waiting for spans.</p>
            </div>
          )}

          {!isLoading && !isError && data.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {data.map((item) => {
                const share = total > 0 ? item.count / total : 0;
                return (
                  <div key={item.tag} className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1231]/70 via-[#10143C]/65 to-[#0A1027]/75 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">{item.tag}</div>
                        <div className="text-xs text-purple-100/60 mt-1">Last seen {formatAgo(item.lastSeenAt)}</div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30">
                        {Math.round(share * 100)}%
                      </Badge>
                    </div>
                    <GradientBar share={share} />
                    <div className="flex items-center justify-between text-xs text-purple-100/60">
                      <span>{item.count} spans</span>
                      <code className="font-mono text-cyan-200">X-Tag-X: {item.tag}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

