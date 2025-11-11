# TraceX

## Distributed Tracing for x402 Payment Operations

TraceX is a high-performance distributed tracing SDK designed specifically for x402 payment facilitators. It provides real-time visibility into payment operations with minimal overhead and end-to-end encryption. So comfort logs you haven't seen any!

**Key Features:**

- **On-chain correlation** — native support for Solana signatures, wallets, and cluster tracking
- **Encrypted telemetry** — AES-256-GCM + RSA-2048 encryption for secure data transmission
- **< 1ms overhead** — Lock-free circular buffer, zero-copy serialization, async I/O

![TraceX Demo](https://github.com/ArturInspector/tracex/blob/main/docs/media/tracex-demo.gif?raw=true)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/status-production--ready-1abc9c)](https://www.npmjs.com/package/@arturinspector/tracex-logger)
[![npm version](https://img.shields.io/npm/v/@arturinspector/tracex-logger)](https://www.npmjs.com/package/@arturinspector/tracex-logger)

---

## Quick Links

https://tracex-bice.vercel.app
https://tracex-bice.vercel.app/docs

---

## Comparison

| Capability | TraceX | OpenTelemetry | Datadog | Plain Logs |
| --- | :---: | :---: | :---: | :---: |
| **Per-span overhead** | < 1 ms | 3-5 ms | 5-10 ms | 8-10 ms |
| **x402-aware** | ✅ Built-in | ❌ Custom | ❌ Custom | ❌ None |
| **On-chain correlation** | ✅ Solana native | ❌ Manual | ❌ Manual | ❌ None |
| **End-to-end encryption** | ✅ Default | ⚠️ Plugins | ⚠️ Extra cost | ❌ None |
| **Batching (100+ spans)** | ✅ Non-blocking | ⚠️ Config | ⚠️ Config | ❌ None |
| **Lock-free hot path** | ✅ Atomic ring buffer | ❌ Mutex | ❌ Unknown | ❌ Sync I/O |
| **Public metrics** | ✅ Anonymous | ❌ None | ❌ None | ❌ None |
| **Cost** | **FREE** | FREE | $$$$ | FREE |

---

## Quick Start

### 1. Install

```bash
npm install @arturinspector/tracex-logger
```

### 2. Initialize Tracer

```ts
import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  apiUrl: 'https://api.tracex.io',
  encryption: { enabled: true, facilitatorId: 'your-id' }
});
```

### 3. Wrap Operations

```ts
const span = tracer.startSpan('payment_operation');
await span.wrap(async () => {
  req.headers['X-Tag-X'] = 'Service';
  await verifyTransaction();
});
```

Your payment operations are now fully traced with on-chain correlation.

---

## Features

### 1. **On-Chain Correlation** (Unique to TraceX)

Every span automatically captures:
- Solana transaction signatures
- Wallet addresses
- Cluster (mainnet/devnet/testnet)
- RPC endpoint
- Signature confirmation status (processed/confirmed/finalized)

```ts
span.addAttribute('signature', '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp...');
span.addAttribute('wallet', '7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU...');
span.addAttribute('cluster', 'mainnet-beta');
```

### 2. **Encrypted Telemetry** (Trust + Security)

- **AES-256-GCM** for span data encryption
- **RSA-2048** for key exchange
- **Zero-knowledge backend** — even we can't read your traces without your key (daamn we are so honest)
- **Competitor-safe** — Share observability data without leaking trade secrets

```ts
const tracer = new X402Tracer({
  encryption: {
    enabled: true,
    keysPath: './.keys',
    facilitatorId: 'your-facilitator-id'
  }
});
```

### 3. **< 1ms Overhead** (Performance Obsessed)

- **Lock-free circular buffer** — atomic operations, zero mutex contention
- **Zero-copy serialization** — reuse pre-allocated buffers
- **Async flush** — network I/O runs in background, never blocks hot path
- **Batch mode** — 100+ spans per HTTP request

**benchmarks (MacBook M1, Node 20):**
```
✓ startSpan + end: 0.23ms (4,347 ops/sec)
✓ Buffer write:    0.15ms (6,666 ops/sec)
✓ Batch flush:     2.5ms  (400 ops/sec, 100 spans)


---

## Architecture

```
┌─────────────────┐
│ Your App        │
│  (facilitator)  │
└────────┬────────┘
         │ < 1ms overhead
         ▼
┌─────────────────┐
│ TraceX SDK      │
│ - Lock-free buf │
│ - AES-256 enc   │
│ - Batch flush   │
└────────┬────────┘
         │ HTTPS (encrypted)
         ▼
┌─────────────────┐
│ TraceX Backend  │
│ - PostgreSQL    │
│ - Solana RPC    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dashboard       │
│ - Live feed     │
│ - On-chain data │
│ - Alerts        │
└─────────────────┘
```

---

## Packages

| Package | Description | Status |
| --- | --- | :---: |
| [`@arturinspector/tracex-logger`](https://www.npmjs.com/package/@arturinspector/tracex-logger) | Core SDK for tracing | ✅ Published |
| `tracex-backend` | Collection API + storage | ✅ Running |
| `tracex-frontend` | Dashboard UI | ✅ Live |

---

## Demo

### Try It Live

Experience TraceX in action with encrypted demo data:
1. Visit the demo page (start frontend: `npm run dev`)
2. Click "Generate Demo & View Dashboard"
3. Backend creates ~30 encrypted spans with realistic payment operations
4. You're redirected to the dashboard with decrypt credentials
5. View real encrypted telemetry with on-chain correlation

### Local Development

```bash
# Clone repo
git clone https://github.com/ArturInspector/tracex
cd tracex

# Start PostgreSQL
docker-compose up -d


cd tracex-backend
npm install
npm run dev  # Runs on http://localhost:3002


cd tracex-frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

---

## Documentation

https://tracex-bice.vercel.app/docs

---

## Contributing

We welcome contributions! TraceX is fully open-source.

**Guidelines:**
- Use strict TypeScript (no `any`)
- cover hot paths with performance tests
- follow x402 security requirements (Zod validation, no blocking I/O)
- keep overhead < 1ms per span

---

## Roadmap

- [yes] Core SDK (lock-free buffer, encryption, batching)
- [yes] Backend API (PostgreSQL, trace storage)
- [x] Live Dashboard (span feed, on-chain insights)
- [x] Interactive Demo (encrypted demo data generation)
- [ ] Alerting system (webhooks, notifications)
- [ ] Query language (filter spans by attributes)

---

## Community & Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/ArturInspector/tracex/issues)
- **Email:** team@tracex.io

---

## License

MIT License — use it freely in production, internal tooling, and research.
