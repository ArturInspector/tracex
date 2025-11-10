'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function IntegrationsSection() {
  const integrations = [
    {
      name: 'x402 Facilitator',
      description: 'Real-time monitoring of payment operations',
      status: 'active',
    },
    {
      name: 'Solana RPC',
      description: 'Tracing all RPC calls with performance metrics',
      status: 'active',
    },
    {
      name: 'Payment Gateway',
      description: 'Track verify, settle, validate operations',
      status: 'active',
    },
    {
      name: 'Custom Backend',
      description: 'Integration via simple HTTP API',
      status: 'coming',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          Integrations
        </h2>
        <p className="text-purple-300/70 text-lg">
          Connect in 3 lines of code. We're not joking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, i) => (
          <Card
            key={i}
            className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-500/60 transition-all animate-slide-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white">{integration.name}</h3>
              <Badge
                variant={integration.status === 'active' ? 'default' : 'secondary'}
                className={integration.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}
              >
                {integration.status === 'active' ? 'Active' : 'Coming Soon'}
              </Badge>
            </div>
            <p className="text-purple-300/80">{integration.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8 bg-gradient-to-r from-purple-950/80 to-blue-950/80 border-purple-500/50 backdrop-blur-sm mt-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Integration Example</h3>
          <pre className="bg-black/50 p-4 rounded-lg text-left text-sm text-purple-300 font-mono overflow-x-auto">
{`import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  apiUrl: 'https://api.tracex.io',
  apiKey: 'your-key'
});

const span = tracer.startSpan('payment_operation');
await span.wrap(async () => {
  // Your code here
});
// Done! Logs sent automatically.`}
          </pre>
        </div>
      </Card>
    </div>
  );
}
