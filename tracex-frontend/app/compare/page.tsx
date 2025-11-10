'use client';

import { MetricsComparison } from '@/components/metrics-comparison';

export default function ComparePage() {
  return (
    <div className="min-h-screen cosmic-bg relative overflow-x-hidden p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Facilitator Comparison</h1>
          <p className="text-purple-300/70">
            Compare anonymous metrics from different facilitators
          </p>
        </div>
        <MetricsComparison />
      </div>
    </div>
  );
}

