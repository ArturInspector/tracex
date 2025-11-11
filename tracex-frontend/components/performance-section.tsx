'use client';

import { Card } from '@/components/ui/card';

export function PerformanceSection() {
  const features = [
    {
      title: 'Lock-Free Buffer',
      description: 'O(1) writes to circular buffer without locks. Even quantum computers are jealous.',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'Non-Blocking I/O',
      description:
        'Transport runs fully async: end-to-end encryption, local key handling, and decentralized relays stay off the hot path.',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'Pre-allocated Memory',
      description: 'Memory allocated upfront. Zero allocations in hot path. Pure speed madness.',
      color: 'from-green-500/20 to-emerald-500/20',
    },
    {
      title: 'Batch Operations',
      description: '100+ spans per HTTP request. Efficiency at intergalactic communication levels.',
      color: 'from-orange-500/20 to-red-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Fast Logging Mechanism
        </h2>
        <p className="text-purple-300/70 text-base sm:text-lg px-2">
          We made logging faster than thought speed. Seriously.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, i) => (
          <Card
            key={i}
            className={`p-6 bg-gradient-to-br ${feature.color} border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-transform animate-slide-in`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-purple-200/80">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 bg-gradient-to-r from-purple-950/80 to-blue-950/80 border-purple-500/50 backdrop-blur-sm mt-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4 font-mono">
            Result: Overhead {'<'} 1ms per span
          </h3>
          <p className="text-purple-300/80 text-lg">
            Faster than you can read this sentence. Verify yourself in{' '}
            <code className="bg-black/30 px-2 py-1 rounded text-purple-300 font-mono">PERFORMANCE.md</code>
          </p>
        </div>
      </Card>
    </div>
  );
}
