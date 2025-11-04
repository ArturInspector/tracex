# TraceX Logger

<div align="center">

**Production-ready distributed tracing SDK for x402 payment operations**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Performance](https://img.shields.io/badge/Performance-<1ms-green?style=for-the-badge)](./PLAN.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**⚡ Zero-overhead • Production-ready • Real-time visibility**

</div>

---

## Overview

**TraceX Logger** is a high-performance TypeScript SDK for monitoring payment operations in the x402 ecosystem. Built with performance as the top priority, it provides comprehensive visibility into facilitator operations without impacting critical payment flows.

### Why TraceX?

- **🔍 Full Visibility**: Track every step of payment operations (verify, settle, validate)
- **⚡ Ultra-Low Overhead**: < 1ms per span, non-blocking async operations
- **🎯 Simple Integration**: 3-5 lines of code to start tracing
- **📦 Production-Ready**: Lock-free buffers, automatic batching, retry mechanisms
- **🚀 High Performance**: Optimized for 1000+ traces/second

---

## ✨ Key Features

- 🎯 **Minimal Overhead** - Sub-millisecond span recording with O(1) buffer operations
- 🔄 **Async Transport** - Non-blocking HTTP flush with automatic batching (100+ spans)
- 🔒 **Lock-Free Buffer** - Circular buffer with atomic operations for high concurrency
- 📊 **Rich Metadata** - Track RPC endpoints, network stats, facilitator info
- 🛡️ **Error Tracking** - Automatic error capture with stack traces and context
- 🔧 **Zero Config** - Works out of the box with sensible defaults

---

## 📦 Installation

```bash
npm install @tracex/logger
```

---

## 🚀 Quick Start

```typescript
import { X402Tracer } from '@tracex/logger';

// Initialize tracer
const tracer = new X402Tracer({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.tracex.com/traces',
});

// Start a trace and wrap operations
const trace = tracer.startTrace({
  agentId: 'agent_123',
  facilitator: 'Jupiter',
});

await trace.startSpan('validate_payment').wrap(async () => {
  await validatePayment(payment);
});

await trace.startSpan('solana_transaction').wrap(async () => {
  const tx = await solana.sendTransaction(payment);
  trace.addMetadata({ txHash: tx.signature });
});

// Automatically flushed in background
```

---

## ⚡ Performance

TraceX is optimized for **production workloads** with minimal overhead:

| Operation | Target Latency |
|-----------|---------------|
| `span.start()` | < 0.1 ms |
| `span.end()` | < 0.1 ms |
| HTTP flush | Non-blocking (async) |

**Critical Requirement**: `overhead < 1ms per span` ✅

---

## 🔧 Configuration

```typescript
const tracer = new X402Tracer({
  apiUrl?: string;           // Optional: Backend API URL
  apiKey?: string;           // Optional: API key for authentication
  bufferSize?: number;       // Optional: Default 1000
  batchSize?: number;        // Optional: Default 100
  flushIntervalMs?: number;  // Optional: Default 5000ms
  autoFlush?: boolean;       // Optional: Default true
  metadata?: TraceMetadata;  // Optional: Default trace metadata
});
```

---

## 🛡️ Production Ready

- ✅ Non-blocking async operations
- ✅ Automatic retry with exponential backoff
- ✅ Memory efficient with pre-allocated buffers
- ✅ Security: Never logs secrets or private keys
- ✅ Built-in rate limiting

---

## 📚 Documentation

- [Full Documentation](./PLAN.md)
- [Architecture Overview](./PLAN.md#2-архитектура-sdk)
- [Performance Benchmarks](./PLAN.md#3-математическая-модель-производительности)

---

<div align="center">

**Built with ⚡ for the x402 ecosystem**

[Report Bug](https://github.com/your-org/tracex/issues) • [Request Feature](https://github.com/your-org/tracex/issues)

</div>
