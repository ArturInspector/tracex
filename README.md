# 🔍 TraceX

TraceX is an ultra-fast distributed tracing layer for x402 payment operations with < 1 ms overhead per span.

![TraceX Demo](docs/media/tracex-demo.gif)

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white) ![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg) ![Status: MVP](https://img.shields.io/badge/status-production--ready-1abc9c)

---

## Why TraceX?

| Capability | TraceX | OpenTelemetry SDK | Plain Logging |
| --- | --- | --- | --- |
| Per-span overhead | < 1 ms, lock-free buffer | 3–5 ms, locks | 8–10 ms, full formatting |
| Encryption | AES-256-GCM + RSA by default | Extra plugins | None |
| x402 aware | Built-in nonce/settle flows | Needs customization | Missing |
| Batching | 100+ spans, non-blocking flush | Config-limited | None |
| Public metrics | Anonymous, aggregated | Requires external system | None |

---

## Features

- ⚡ **Hot-path latency**: lock-free ring buffer and zero-copy serialization keep tracing outside the critical payment path.
- 🔒 **End-to-end encryption**: keys rotate via `KeyManager`, every span batch is encrypted asynchronously.
- 🌐 **x402-native context**: built-in Zod schemas, nonce validation, sponsor-fee metadata.
- 📊 **Batch + metrics**: automatic batching, async flush, anonymous public metrics.
- 🧩 **Composable SDK**: DI-friendly architecture; Transport/Buffer can be swapped in tests.

---

## Quick Start

> [!NOTE]
> SDK installation: `npm install @arturinspector/tracex-logger`

**Before**

```ts
const started = Date.now();
try {
  await settlePayment(payload);
  console.log('settled in', Date.now() - started, 'ms');
} catch (error) {
  console.error('settle failed', error);
}
```

**After**

```ts
import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  metadata: { service: 'payments-api' },
  apiUrl: process.env.TRACEX_COLLECTOR,
  apiKey: process.env.TRACEX_API_KEY,
  batchSize: 128,
  encryption: { enabled: true, keysPath: './keys', facilitatorId: 'sponsor-01' },
});

export async function settlePaymentGuard(payload: PaymentPayload) {
  const span = tracer.startSpan('facilitator.settle');
  try {
    await settlePayment(payload);
    span.ok({ amount: payload.amount });
  } catch (error) {
    span.fail(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

## Examples

<details>
<summary>Basic Usage</summary>

```ts
import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  metadata: { service: 'merchant-api', region: 'fra-1' },
  batchSize: 100,
  apiUrl: 'https://collector.tracex.network',
  apiKey: process.env.TRACEX_API_KEY,
});

const span = tracer.startSpan('verify.nonce');
try {
  await verifyNonce(request.nonce);
  span.ok();
} catch (error) {
  span.fail(error);
  throw error;
} finally {
  span.end();
}
```

</details>

<details>
<summary>Advanced Features</summary>

```ts
import { X402Tracer } from '@arturinspector/tracex-logger';
import { Transport } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  metadata: { service: 'sponsor-facilitator' },
  bufferSize: 2048,
  batchSize: 256,
  flushIntervalMs: 2_000,
  encryption: { enabled: true, keysPath: './.keys', facilitatorId: 'sponsor-eu-west' },
  publicMetrics: { enabled: true },
  apiUrl: 'https://collector.tracex.network',
  apiKey: process.env.TRACEX_API_KEY,
});

// In tests we swap the Transport for a local mock
const mockTransport = new Transport({
  apiUrl: 'http://localhost:8787',
  apiKey: 'local-dev',
  encryptionEnabled: false,
});

tracer.addMetadata('cluster', 'solana-devnet');

await tracer.publishPublicMetrics();
await tracer.flush();
await tracer.shutdown();
```

</details>

---

## Documentation

- Main SDK docs: [`tracex/logger/SUMMARY.md`](./tracex/logger/SUMMARY.md)
- Performance plan and KPIs: [`PLAN.md`](./PLAN.md)
- Encryption and keys: [`tracex/logger/src/crypto`](./tracex/logger/src/crypto)

---

## Contributing

We welcome PRs: keep strict TypeScript, cover hot paths with spans, and follow x402 security requirements (input validation via Zod, no blocking I/O, sanitized logs).

---

## License

MIT License — use it freely in production, internal tooling, and research. Let us know if you build something great on top of TraceX.
