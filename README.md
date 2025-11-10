# TraceX • Real-Time x402 Telemetry

TraceX is the operational nerve center for the x402 payments network. This repository contains:

- `logger/` — the `@arturinspector/tracex-logger` npm package: a production-grade, end-to-end encrypted tracing SDK with <1 ms overhead per span.
- `tracex-backend/` — the reference collector + analytics API that ingests those spans so facilitators, settlers, and control-plane teams can watch payments live.

Everything here is open source and built for teams already running money flows, not for classroom demos.

---

## Why TraceX exists
- **Facilitators** need to see verify/settle latency in real time, trace RPC hotspots, and prove SLA compliance.
- **Settlers & treasury** teams need a trustworthy audit trail for each settlement pipeline and retry storm.
- **Control plane / ops** teams need encrypted telemetry they can share with partners without leaking payloads, keys, or client metadata.

TraceX focuses on those production requirements: lock-free instrumentation, batch transport, hybrid crypto, and a backend that lets you explore traces the moment they are emitted.

---

## Components

### `@arturinspector/tracex-logger` (npm package)
- Sub-millisecond span recording using a lock-free circular buffer
- Asynchronous, batched HTTP transport (100+ spans per request) with exponential retry
- Hybrid encryption (AES-256-GCM per batch, RSA for key exchange) so telemetry is safe in transit and at rest
- Works in facilitator services, settlement daemons, or any x402-aware backend
- Published on npm: `npm install @arturinspector/tracex-logger`

Essential docs live in `logger/`:
- [`SUMMARY.md`](./logger/SUMMARY.md) — SDK capabilities and API surface
- [`PERFORMANCE.md`](./logger/PERFORMANCE.md) — architecture and benchmarks
- [`TEST.md`](./logger/TEST.md) — expected behaviors and edge cases

### `tracex-backend`
- Ingests encrypted batches from the logger SDK
- Performs RSA key registration, AES decryption, validation, and persistence
- Exposes health/stats endpoints for ops dashboards
- Written in strict TypeScript with Zod validation to match x402 security posture

See `tracex-backend/README.md` for route details and deployment notes.

---

## Implementations included here

| Directory | Purpose |
| --- | --- |
| `logger/` | Source of the `@arturinspector/tracex-logger` package (published to npm) |
| `tracex-backend/` | Collector and monitoring API that consumes the SDK spans |

Other folders in the repo are experimental and out of scope for this documentation.

---

## Quick start (local lab)

```bash
# 1. Install repo dependencies
npm install

# 2. Build the logger package and backend
cd logger && npm run build
cd ../tracex-backend && npm install && npm run build

# 3. Run the collector locally (defaults to http://localhost:3002)
npm run start:dev

# 4. Emit traces from any service
npm install @arturinspector/tracex-logger
```

Inside your facilitator or settler service:

```typescript
import { X402Tracer } from '@arturinspector/tracex-logger';

const tracer = new X402Tracer({
  apiUrl: process.env.TRACEX_API_URL ?? 'http://localhost:3002',
  apiKey: process.env.TRACEX_API_KEY,
  encryptionEnabled: true,
  facilitatorId: 'facilitator-mainnet',
});

const span = tracer.startSpan('settle_payment');
await span.wrap(async () => {
  await verifyOrder();
  await settleOnChain();
});
```

You will see the span batch arrive in the backend logs immediately (still encrypted until it reaches the decryptor).

---

## One-command docker setup

For demos or online hackathons you can run everything with Docker Compose:

```bash
cd tracex
docker compose up --build
```

Services exposed:
- `postgres` on `localhost:5432`
- `tracex-backend` on `http://localhost:3002`

Stop with `docker compose down`. Data persists inside the `postgres_data` volume.

---

## Encryption pipeline

1. Logger batches spans in memory (<1 ms per span) and serializes them without copies.
2. Each batch is sealed with AES-256-GCM; the symmetric key is wrapped with the collector’s RSA key.
3. The collector verifies facilitator identity, decrypts the payload, and streams it to persistence and observability backends.
4. Sensitive attributes are sanitized; secrets, private keys, and raw payloads never leave your process.

This is crucial for operators who must share telemetry with partners while keeping payment data locked down.

---

## Production guarantees

- No blocking calls on the hot path (everything async, flush happens in the background thread pool)
- Pre-allocated buffers to minimize GC churn under burst traffic
- Mandatory Zod validation on every ingress route in `tracex-backend`
- Strict separation between tracing metadata and business payloads to avoid data leaks

Benchmarks, constraints, and hard targets are documented in `logger/PERFORMANCE.md`.

---

## Contribution guidelines

We welcome pull requests that improve the logger SDK or the collector. Please keep changes:

- Compatible with Node 18+ runtime and ES module build pipeline
- Covered by tests (unit or integration) when touching hot paths
- Measured — add or update benchmarks when you optimize the core buffer/transport
- Observable — new functionality should emit spans that adhere to the existing schema

Open an issue if you plan to add new transports (gRPC, WebSocket), storage backends, or encryption strategies so we can coordinate roadmap impact.

---

## License

MIT. Use TraceX in commercial facilitators, settlement services, or your internal ops tooling. If you launch a product on top of it, we’d love to hear the story.
