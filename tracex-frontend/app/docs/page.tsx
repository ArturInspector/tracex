'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const sections = [
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'configuration', title: 'Configuration' },
  { id: 'integration', title: 'Integration' },
  { id: 'encryption', title: 'Encryption & Keys' },
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'metrics', title: 'Public Metrics' },
  { id: 'performance', title: 'Performance' },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quick-start');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || 'quick-start');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen cosmic-bg relative overflow-x-hidden">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-black/40 border-r border-purple-500/20 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <Link href="/" className="block mb-8">
              <h2 className="text-2xl font-mono font-bold text-purple-300">TRACEX</h2>
              <p className="text-xs text-purple-400/60 mt-1">Documentation</p>
            </Link>
            
            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-600/30 text-purple-300 border-l-2 border-purple-500'
                      : 'text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10'
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-purple-500/20">
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full border-purple-500/50 text-purple-300">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full border-purple-500/50 text-purple-300">
                  <Link href="/compare">Compare</Link>
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">TraceX Documentation</h1>
              <p className="text-purple-300/70">
                Complete guide to integrating TraceX SDK into your x402 facilitator
              </p>
            </div>

            {/* Quick Start */}
            <section id="quick-start" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">1. Install SDK</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`npm install @arturinspector/tracex-logger`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">2. Initialize Tracer</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  apiUrl: 'https://api.tracex.io',
  apiKey: 'your-api-key',
  encryption: {
    enabled: true,
    facilitatorId: 'your-facilitator-public-key',
  },
  publicMetrics: {
    enabled: true, // optional
  },
  metadata: {
    facilitator: 'your-facilitator-public-key',
    rpc: 'https://api.devnet.solana.com',
  },
});`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">3. Create Spans</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`// Manual span management
const span = tracer.startSpan('operation_name');
try {
  await doSomething();
  span.success();
} catch (error) {
  span.fail({ message: error.message });
} finally {
  span.end();
}

// Automatic span wrapping
await span.wrap(async () => {
  await doSomething();
});`}
                    </pre>
                  </div>
                </div>
              </Card>
            </section>

            {/* Configuration */}
            <section id="configuration" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Environment Variables</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`TRACEX_API_URL=http://localhost:3002
TRACEX_API_KEY=your-api-key
TRACEX_PUBLIC_METRICS=true  # optional`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">TraceConfig Options</h3>
                    <div className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
                      <div className="space-y-2">
                        <div><span className="text-purple-400">apiUrl</span>: string - TraceX API endpoint</div>
                        <div><span className="text-purple-400">apiKey</span>: string - API key (optional)</div>
                        <div><span className="text-purple-400">encryption.enabled</span>: boolean - enable encryption</div>
                        <div><span className="text-purple-400">encryption.facilitatorId</span>: string - facilitator identifier</div>
                        <div><span className="text-purple-400">publicMetrics.enabled</span>: boolean - publish anonymous metrics</div>
                        <div><span className="text-purple-400">bufferSize</span>: number - buffer size (default: 1000)</div>
                        <div><span className="text-purple-400">batchSize</span>: number - batch size (default: 100)</div>
                        <div><span className="text-purple-400">flushIntervalMs</span>: number - flush interval (default: 5000)</div>
                        <div><span className="text-purple-400">autoFlush</span>: boolean - auto flush (default: true)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Integration Example */}
            <section id="integration" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Integration Example</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Express Route</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`import { X402Tracer } from '@arturinspector/tracex-logger';

// Initialize once at app startup
const tracer = new X402Tracer({
  apiUrl: process.env.TRACEX_API_URL!,
  encryption: {
    enabled: true,
    facilitatorId: facilitatorAddress.toString(),
  },
});

// Use in route handler
app.post('/verify', async (req, res) => {
  const span = tracer.startSpan('verify_payment');
  
  try {
    const validateSpan = tracer.startSpan('validate_request');
    const isValid = validatePayment(req.body);
    validateSpan.end();
    
    if (!isValid) {
      span.fail({ message: 'Invalid payment' });
      return res.json({ error: 'Invalid' });
    }
    
    const dbSpan = tracer.startSpan('store_nonce');
    await storeNonce(req.body.nonce);
    dbSpan.end();
    
    span.success();
    res.json({ isValid: true });
  } catch (error) {
    span.fail({
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal error' });
  }
});`}
                    </pre>
                  </div>
                </div>
              </Card>
            </section>

            {/* Encryption & Keys */}
            <section id="encryption" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Encryption & Keys</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Automatic Key Generation</h3>
                    <p className="text-purple-200/80 mb-2">
                      SDK automatically generates RSA keys on first use. Keys are stored in:
                    </p>
                    <ul className="list-disc list-inside text-purple-200/80 space-y-1 ml-4">
                <li><code className="bg-black/40 px-1 rounded">.tracex-keys.json</code> file (Node.js)</li>
                <li><code className="bg-black/40 px-1 rounded">localStorage</code> (browser)</li>
                <li>Environment variables: <code className="bg-black/40 px-1 rounded">TRACEX_PUBLIC_KEY</code> and <code className="bg-black/40 px-1 rounded">TRACEX_PRIVATE_KEY</code></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Export Keys for Dashboard</h3>
                    <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`// Get private key for dashboard decryption
const privateKey = await tracer.getPrivateKey();
// Store this key securely!

// Public key is automatically registered on server`}
                    </pre>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-300 text-sm">
                      <strong>⚠️ Important:</strong> Private key is only needed for dashboard decryption. 
                      Never share it with servers or commit to public repositories!
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Dashboard Usage */}
            <section id="dashboard" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Viewing Traces</h3>
              <p className="text-purple-200/80 mb-2">
                Open <Link href="/dashboard" className="text-purple-400 hover:underline">/dashboard</Link> and provide:
              </p>
              <ul className="list-disc list-inside text-purple-200/80 space-y-1 ml-4">
                <li>Private key (for decryption)</li>
                <li>Facilitator ID (your public key)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-purple-200/80">
                      Traces are decrypted client-side and displayed with waterfall charts for performance analysis.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Public Metrics */}
            <section id="metrics" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Public Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Enable Anonymous Metrics</h3>
              <pre className="bg-black/40 p-4 rounded-lg text-sm text-purple-200 font-mono overflow-x-auto">
{`const tracer = new X402Tracer({
  publicMetrics: {
    enabled: true,
  },
});

// Metrics published automatically
// Or manually:
await tracer.publishPublicMetrics();`}
                    </pre>
                  </div>

                  <div>
                    <p className="text-purple-200/80">
                      View facilitator comparison at <Link href="/compare" className="text-purple-400 hover:underline">/compare</Link> (anonymous).
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Performance */}
            <section id="performance" className="scroll-mt-8">
              <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Performance</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-1">✓</Badge>
              <div>
                <p className="text-purple-200/80">
                  <strong>Overhead {'<'} 1ms per span</strong> - optimized for minimal performance impact
                </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-1">✓</Badge>
                    <div>
                      <p className="text-purple-200/80">
                        <strong>Non-blocking</strong> - all operations are asynchronous
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-1">✓</Badge>
                    <div>
                      <p className="text-purple-200/80">
                        <strong>Batch operations</strong> - traces grouped before sending (100+ spans per request)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-1">✓</Badge>
                    <div>
                      <p className="text-purple-200/80">
                        <strong>Auto-flush</strong> - automatic sending every 5s or when batchSize reached
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

