'use client';

import { useState } from 'react';
import { StarsBackground } from '@/components/stars-background';
import { SpeedEffects } from '@/components/speed-effects';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function DemoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Вызываем backend для генерации demo data
      const response = await fetch(`${API_URL}/api/demo/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate demo data');
      }

      const data = await response.json();
      
      // Сохраняем credentials в sessionStorage (НЕ в URL!)
      sessionStorage.setItem('demo_facilitatorId', data.facilitatorId);
      sessionStorage.setItem('demo_decryptKey', data.decryptKey);
      sessionStorage.setItem('demo_mode', 'true');
      
      // Редирект на dashboard без параметров
      router.push('/dashboard');
    } catch (err) {
      console.error('Demo generation failed:', err);
      setError(err instanceof Error ? err.message : 'Network error. Make sure backend is running on port 3002.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg relative">
      <StarsBackground />
      <SpeedEffects />

      {/* Header */}
      <div className="relative z-10 px-4 py-6 border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-2xl font-mono font-bold text-purple-300 hover:text-purple-200 transition-colors">
              ← TRACEX
            </Link>
            <p className="text-sm text-purple-400/60 mt-1">Interactive Demo</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="border-purple-400/40 text-purple-100 hover:bg-purple-500/10">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="TraceX logo"
                width={80}
                height={80}
                className="drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Experience TraceX in Action
            </h1>
            <p className="text-lg text-purple-200/80 max-w-2xl mx-auto">
              See how TraceX captures encrypted payment telemetry with on-chain correlation.
              <br />
              No sign up, no bullshit. Just click the button.
            </p>
          </div>

          {/* Main Demo Card */}
          <Card className="p-8 md:p-12 bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <div className="space-y-8">
              {/* What You'll See */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  What You'll Experience
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="text-cyan-400 text-xl">🔐</div>
                    <div>
                      <div className="text-white font-medium mb-1">Real Encryption</div>
                      <div className="text-sm text-purple-300/70">
                        AES-256-GCM + RSA-2048 encrypted spans (we're not joking)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-cyan-400 text-xl">⛓️</div>
                    <div>
                      <div className="text-white font-medium mb-1">On-Chain Correlation</div>
                      <div className="text-sm text-purple-300/70">
                        Solana signatures, wallets, clusters (the whole shebang)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-cyan-400 text-xl">📊</div>
                    <div>
                      <div className="text-white font-medium mb-1">Live Dashboard</div>
                      <div className="text-sm text-purple-300/70">
                        Real-time span feed (not a mock, actual encrypted data)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-cyan-400 text-xl">⚡</div>
                    <div>
                      <div className="text-white font-medium mb-1">{'<'}1ms Overhead</div>
                      <div className="text-sm text-purple-300/70">
                        Production-ready (yes, you can use this today)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  How It Works
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">1</Badge>
                    <div className="text-sm text-purple-200/80">
                      We generate a temporary facilitator ID and encryption keys (takes ~1 second)
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">2</Badge>
                    <div className="text-sm text-purple-200/80">
                      Backend creates ~30 realistic payment spans (verify, settle, RPC calls, the usual stuff)
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">3</Badge>
                    <div className="text-sm text-purple-200/80">
                      Each span is encrypted with your temporary keys (proper AES-256-GCM, not some toy encryption)
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">4</Badge>
                    <div className="text-sm text-purple-200/80">
                      You're redirected to the dashboard with your decrypt key (congratulations, you're now a facilitator)
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4">
                <Button
                  size="lg"
                  onClick={handleGenerateDemo}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-medium shadow-[0_20px_60px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Generating encrypted spans...
                    </>
                  ) : (
                    <>
                      Generate Demo & View Dashboard
                    </>
                  )}
                </Button>
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <p className="text-sm text-purple-400/60 mt-4">
                  Takes ~2 seconds. No signup required. No credit card. No newsletter spam.
                </p>
              </div>
            </div>
          </Card>

          {/* Technical Details */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card className="p-4 bg-black/30 border-purple-500/20">
              <div className="text-purple-400 font-mono text-sm mb-2">Encryption</div>
              <div className="text-white text-xs">
                AES-256-GCM for span data, RSA-2048 for key exchange
              </div>
            </Card>
            <Card className="p-4 bg-black/30 border-purple-500/20">
              <div className="text-purple-400 font-mono text-sm mb-2">Storage</div>
              <div className="text-white text-xs">
                PostgreSQL with encrypted blob storage (because we care about your data)
              </div>
            </Card>
            <Card className="p-4 bg-black/30 border-purple-500/20">
              <div className="text-purple-400 font-mono text-sm mb-2">Performance</div>
              <div className="text-white text-xs">
                {'<'}1ms overhead, 9K+ spans/sec throughput (benchmarked, not made up)
              </div>
            </Card>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-purple-400/60">
              Want to use TraceX in production?{' '}
              <Link href="/docs" className="text-purple-300 underline hover:text-purple-200">
                Read the docs
              </Link>
              {' '}or{' '}
              <a
                href="https://www.npmjs.com/package/@arturinspector/tracex-logger"
                target="_blank"
                rel="noreferrer"
                className="text-purple-300 underline hover:text-purple-200"
              >
                install from npm
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
