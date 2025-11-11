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
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20 touch-pan-y">
        {/* Darkened background image */}
        <div className="absolute inset-0 z-0 opacity-10">
          <Image
            src="/images/hero-bg.jpg"
            alt="Space nebula background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/88 via-black/70 to-black/90 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-x-8 top-24 h-72 bg-gradient-to-r from-purple-500/25 via-cyan-500/20 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-6xl lg:max-w-7xl mx-auto w-full relative z-10 px-4 sm:px-6">
          {/* Logo and Open Source Badge */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 sm:mb-14">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-center lg:justify-start">
              <Image
                src="/logo.png"
                alt="TraceX logo"
                width={64}
                height={64}
                priority
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]"
              />
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/70 mb-1 sm:text-sm">
                  TraceX
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-bold text-purple-200 tracking-wide">
                  High-Performance Tracing
                </div>
              </div>
            </div>
            <Badge className="self-center sm:self-auto bg-emerald-500/15 text-emerald-200 border-emerald-400/40 px-4 py-2">
              <span className="mr-2">★</span>
              Open Source
            </Badge>
          </div>

          {/* Main Hero Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 lg:gap-16 items-center mb-12 sm:mb-16">
            <div className="w-full">
              <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start max-w-2xl w-full mx-auto lg:mx-0">
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 text-xs uppercase tracking-[0.32em] text-white/60">
                  <span>Observability-first</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Payment operations</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.65rem] xl:text-[4.05rem] leading-tight font-bold text-white max-w-2xl">
                  Logging SDK for payment-critical telemetry
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    Overhead {'<'} 1ms per span
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-purple-100/80 leading-relaxed max-w-xl">
                  TraceX captures every payment span across the x402 stack without blocking hot paths. Encryption, batching, and transport run in the background so your code keeps flying.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-500 hover:from-purple-600/90 hover:via-violet-600/90 hover:to-cyan-500/90 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium w-full sm:w-auto shadow-[0_18px_55px_rgba(59,130,246,0.25)]"
                    asChild
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/15 text-white/80 hover:bg-white/10 hover:text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/docs">Documentation</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Code Example Card */}
            <Card className="p-5 sm:p-6 bg-[#070B19]/70 border border-purple-500/25 backdrop-blur-xl w-full max-w-md sm:max-w-lg mx-auto lg:mx-0 self-stretch shadow-[0_22px_70px_rgba(88,28,135,0.22)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-white/70 font-mono">example.ts</span>
                <div className="flex gap-2">
                <Badge variant="outline" className="border-emerald-400/40 text-emerald-300 text-xs">
                  TypeScript
                </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-white/70 hover:text-white"
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
                <div className="bg-black/70 rounded p-3 border border-purple-500/25">
                  <div className="text-xs text-purple-200/70 mb-1">Install</div>
                  <code className="text-sm text-purple-100 font-mono">
                    npm install @arturinspector/tracex-logger
                  </code>
                </div>
                <pre className="text-sm text-slate-100 font-mono overflow-x-auto bg-black/40 p-3 rounded border border-purple-500/15">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-300 mb-1 font-mono">{'<'} 1ms</div>
              <div className="text-xs sm:text-sm text-purple-400/70">Overhead per span</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-300 mb-1 font-mono">10K+</div>
              <div className="text-xs sm:text-sm text-purple-400/70">Spans per second</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-300 mb-1 font-mono">MIT</div>
              <div className="text-xs sm:text-sm text-purple-400/70">Open Source</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-300 mb-1 font-mono">100%</div>
              <div className="text-xs sm:text-sm text-purple-400/70">Non-blocking</div>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Badge variant="outline" className="border-white/20 text-white/70 uppercase tracking-[0.3em] px-5 py-2">
              Don't be blind in x402
            </Badge>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Performance Metrics
            </h2>
            <p className="text-purple-300/70 text-base sm:text-lg px-2">
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
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="TraceX logo"
                  width={56}
                  height={56}
                  className="w-12 h-12 drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                />
                <div className="text-2xl font-mono font-bold text-purple-300">TRACEX</div>
              </div>
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
                  href="https://github.com/ArturInspector/tracex"
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
                  href="https://github.com/ArturInspector/tracex/blob/main/LICENSE"
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
