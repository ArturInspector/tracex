'use client';

import Image from 'next/image';
import Link from 'next/link';
import { StarsBackground } from '@/components/stars-background';
import { SpeedEffects } from '@/components/speed-effects';
import { FloatingAlien } from '@/components/floating-alien';
import { LiveLogs } from '@/components/live-logs';
import { MetricsDashboard } from '@/components/metrics-dashboard';
import { PerformanceSection } from '@/components/performance-section';
import { IntegrationsSection } from '@/components/integrations-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen cosmic-bg relative overflow-x-hidden">
      <StarsBackground />
      <SpeedEffects />
      <FloatingAlien />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background Image - темнее */}
        <div className="absolute inset-0 z-0 opacity-10">
          <Image
            src="/images/hero-bg.jpg"
            alt="Space nebula background"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Дополнительное затемнение */}
        <div className="absolute inset-0 z-0 bg-black/60" />
        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Logo and Open Source Badge */}
          <div className="flex items-center justify-between mb-16">
            <div className="text-4xl font-mono font-bold text-purple-300 tracking-wider">
              TRACEX
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 px-4 py-2">
              <span className="mr-2">★</span>
              Open Source
            </Badge>
          </div>

          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                High-Performance
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  Logging SDK
                </span>
              </h1>
              <p className="text-xl text-purple-200/80 mb-8 leading-relaxed">
                Distributed tracing for x402 payment operations monitoring.
                <br />
                <span className="text-purple-400/70 font-mono text-lg">
                  Overhead {'<'} 1ms per span
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-medium"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 px-8 py-6 text-lg font-medium"
                  asChild
                >
                  <Link href="/docs">Documentation</Link>
                </Button>
              </div>
            </div>

            {/* Code Example Card */}
            <Card className="p-6 bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-purple-400/70 font-mono">example.ts</span>
                <div className="flex gap-2">
                <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                  TypeScript
                </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-purple-300 hover:text-white"
                    onClick={() => {
                      const code = `npm install @arturinspector/tracex-logger`;
                      navigator.clipboard.writeText(code);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-black/60 rounded p-3 border border-purple-500/20">
                  <div className="text-xs text-purple-400/60 mb-1">Install</div>
                  <code className="text-sm text-purple-200 font-mono">
                    npm install @arturinspector/tracex-logger
                  </code>
                </div>
                <pre className="text-sm text-purple-200 font-mono overflow-x-auto bg-black/20 p-3 rounded border border-purple-500/10">
{`import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  apiUrl: 'https://api.tracex.io',
  encryption: { enabled: true }
});

const span = tracer.startSpan('payment_operation');
await span.wrap(async () => {
  // Your payment logic here
  await verifyTransaction();
});`}
              </pre>
              </div>
            </Card>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-1 font-mono">{'<'} 1ms</div>
              <div className="text-sm text-purple-400/70">Overhead per span</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-1 font-mono">10K+</div>
              <div className="text-sm text-purple-400/70">Spans per second</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-1 font-mono">MIT</div>
              <div className="text-sm text-purple-400/70">Open Source</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-1 font-mono">100%</div>
              <div className="text-sm text-purple-400/70">Non-blocking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Performance Metrics
            </h2>
            <p className="text-purple-300/70 text-lg">
              Real numbers. Benchmarked. Verified.
            </p>
          </div>
          <MetricsDashboard />
        </div>
      </section>

      {/* Performance Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto relative">
          {/* Background Image */}
          <div className="absolute inset-0 opacity-10 -z-10">
            <Image
              src="/images/performance.jpg"
              alt="Data visualization background"
              fill
              className="object-cover rounded-3xl"
            />
          </div>
          <PerformanceSection />
        </div>
      </section>

      {/* Live Logs Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <LiveLogs />
        </div>
      </section>

      {/* Integrations Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <IntegrationsSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-2xl font-mono font-bold text-purple-300 mb-4">TRACEX</div>
              <p className="text-purple-300/60 text-sm mb-4">
                High-performance distributed tracing SDK for x402 payment operations.
              </p>
              <div className="flex gap-2 flex-wrap">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                Open Source
              </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  MIT License
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                  TypeScript
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm">
                <Link href="/docs" className="block text-purple-400/60 hover:text-purple-300 transition-colors">
                  Documentation
                </Link>
                <Link
                  href="https://github.com/x402-labs/tracex"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-purple-400/60 hover:text-purple-300 transition-colors"
                >
                  GitHub
                </Link>
                <Link href="/docs#configuration" className="block text-purple-400/60 hover:text-purple-300 transition-colors">
                  API Reference
                </Link>
                <Link href="/docs#integration" className="block text-purple-400/60 hover:text-purple-300 transition-colors">
                  Integration examples
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <div className="space-y-2 text-sm">
                <Link
                  href="mailto:team@tracex.io"
                  className="block text-purple-400/60 hover:text-purple-300 transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="https://status.tracex.io"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-purple-400/60 hover:text-purple-300 transition-colors"
                >
                  Status
                </Link>
                <Link href="/docs#performance" className="block text-purple-400/60 hover:text-purple-300 transition-colors">
                  Benchmarks
                </Link>
                <Link
                  href="https://github.com/x402-labs/tracex/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-purple-400/60 hover:text-purple-300 transition-colors"
                >
                  License
                </Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-purple-500/20 text-center text-sm text-purple-400/60">
            © {new Date().getFullYear()} TraceX. MIT License. Built for the x402 ecosystem.
          </div>
        </div>
      </footer>
    </div>
  );
}
