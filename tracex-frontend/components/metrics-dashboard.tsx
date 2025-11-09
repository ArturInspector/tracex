'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MetricsDashboard() {
  const metrics = [
    { label: 'Overhead per span', value: '< 1ms', color: 'text-green-400', unit: 'ms' },
    { label: 'Throughput', value: '10,000+', color: 'text-purple-400', unit: 'spans/s' },
    { label: 'Avg latency', value: '0.05', color: 'text-blue-400', unit: 'ms' },
    { label: 'Accuracy', value: '99.99', color: 'text-cyan-400', unit: '%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card
          key={i}
          className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-500/60 transition-all animate-slide-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
              LIVE
            </Badge>
          </div>
          <div className={`text-3xl font-bold mb-1 font-mono ${metric.color}`}>
            {metric.value}
          </div>
          <div className="text-sm text-purple-300/70">{metric.label}</div>
        </Card>
      ))}
    </div>
  );
}
