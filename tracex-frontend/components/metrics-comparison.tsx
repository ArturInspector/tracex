'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PublicMetric {
  facilitatorId: string;
  successRate: number;
  avgLatency: number;
  totalTransactions: number;
  timestamp: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Mock data for demo/testing
const MOCK_METRICS: PublicMetric[] = [
  {
    facilitatorId: 'Facilitator_A_9xKJP2mNQq4XyZ',
    successRate: 0.987,
    avgLatency: 42.5,
    totalTransactions: 152340,
    timestamp: new Date(),
  },
  {
    facilitatorId: 'Facilitator_B_7nTRg8Lm3WpQvX',
    successRate: 0.992,
    avgLatency: 38.2,
    totalTransactions: 98210,
    timestamp: new Date(),
  },
  {
    facilitatorId: 'Facilitator_C_4hUKj6Nn8RxStZ',
    successRate: 0.978,
    avgLatency: 51.8,
    totalTransactions: 203450,
    timestamp: new Date(),
  },
  {
    facilitatorId: 'Facilitator_D_5vZYm9Qq2TxWnP',
    successRate: 0.995,
    avgLatency: 35.1,
    totalTransactions: 76890,
    timestamp: new Date(),
  },
  {
    facilitatorId: 'Facilitator_E_2wXLp3Kk7MjRsQ',
    successRate: 0.981,
    avgLatency: 46.3,
    totalTransactions: 124560,
    timestamp: new Date(),
  },
];

export function MetricsComparison() {
  const [metrics, setMetrics] = useState<PublicMetric[]>(MOCK_METRICS);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('24h');
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false); // Try real data first

  const loadMetrics = async () => {
    if (useMockData) {
      // Simulate loading with mock data
      setLoading(true);
      setTimeout(() => {
        setMetrics(MOCK_METRICS);
        setLoading(false);
      }, 500);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/metrics/public?period=${period}&limit=50`);

      if (!response.ok) {
        throw new Error(`Failed to load metrics: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setMetrics(data.data);
      } else {
        // Fallback to mock data if no real data
        setMetrics(MOCK_METRICS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      // Fallback to mock data on error
      setMetrics(MOCK_METRICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [period]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [period, useMockData]);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Facilitator Comparison</h3>
          {useMockData && (
            <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
              Demo mode • Mock data
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              className={
                period === p
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'border-purple-500/50 text-purple-300'
              }
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={loadMetrics}
            disabled={loading}
            className="border-purple-500/50 text-purple-300"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 mb-4">{error}</div>
      )}

      {loading && metrics.length === 0 ? (
        <div className="text-center py-8 text-purple-400/50">
          <div className="text-4xl mb-2 font-mono">⏳</div>
          <p>Loading metrics...</p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-8 text-purple-400/50">
          <div className="text-4xl mb-2 font-mono">[ ]</div>
          <p>No public metrics available</p>
          <p className="text-sm mt-2 font-mono text-purple-400/40">
            Facilitators can opt-in to publish anonymous metrics
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-purple-400/70 pb-2 border-b border-purple-500/20">
            <div>Facilitator</div>
            <div className="text-center">Success Rate</div>
            <div className="text-center">Avg Latency</div>
            <div className="text-center">Transactions</div>
            <div className="text-center">Rank</div>
          </div>

          {/* Metrics rows */}
          {metrics
            .sort((a, b) => {
              // Сортировка по success rate, затем по latency
              if (b.successRate !== a.successRate) {
                return b.successRate - a.successRate;
              }
              return a.avgLatency - b.avgLatency;
            })
            .map((metric, index) => (
              <div
                key={metric.facilitatorId}
                className="grid grid-cols-5 gap-4 items-center p-3 bg-black/30 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                <div className="font-mono text-sm text-purple-300">
                  {metric.facilitatorId.substring(0, 12)}...
                </div>
                <div className="text-center">
                  <Badge
                    variant={metric.successRate >= 0.95 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {(metric.successRate * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-center text-purple-300 font-mono text-sm">
                  {metric.avgLatency.toFixed(2)}ms
                </div>
                <div className="text-center text-purple-400/70 text-sm">
                  {metric.totalTransactions.toLocaleString()}
                </div>
                <div className="text-center">
                  <Badge
                    variant={index < 3 ? 'default' : 'outline'}
                    className={
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                        : index === 1
                        ? 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                        : index === 2
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                        : ''
                    }
                  >
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

