'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    title: 'Verified Wallet Registry',
    description:
      'Only signed payment producers can broadcast telemetry. No random addresses, no spoofed spans.',
  },
  {
    title: 'End-to-End Encryption',
    description:
      'Ephemeral session keys seal every packet. Raw trace data never leaves your infrastructure.',
  },
  {
    title: 'Local Key Custody',
    description:
      'You own the keys. TraceX agents sync rotations from your KMS—never from a shared cloud vault.',
  },
  {
    title: 'Decentralized Relay Mesh',
    description:
      'Multi-region relays keep ingestion redundant with sub-millisecond latency on the x402 edge.',
  },
];

export function LiveLogs() {
  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-950/70 via-indigo-950/60 to-cyan-950/40 border-cyan-400/30 shadow-[0_12px_50px_rgba(8,145,178,0.25)] backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          <h3 className="text-2xl font-bold text-white">Wallet Telemetry Mesh</h3>
        </div>
        <Badge variant="outline" className="border-emerald-400/60 text-emerald-300">
          On-chain Live
        </Badge>
      </div>

      <p className="text-slate-200/80 text-base sm:text-lg leading-relaxed mb-6">
        Replaced the manual wallet stub with production ingestion. Verified x402 validators stream
        spans directly from chain, end-to-end encrypted and buffered by the non-blocking transport.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="p-4 rounded-xl bg-slate-900/40 border border-cyan-400/10 hover:border-cyan-300/40 transition-all shadow-[0_0_25px_rgba(8,145,178,0.12)]"
          >
            <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
            <p className="text-sm text-slate-200/70 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-slate-300/60">
          Want trace access? Reach out with your validator ID and we will wire you into the mesh.
        </p>
        <Button
          asChild
          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-50 px-6 py-4 text-sm sm:text-base font-medium shadow-[0_10px_35px_rgba(16,185,129,0.35)]"
        >
          <Link
            href="https://github.com/ArturInspector/tracex/discussions/new?category=q-a"
            target="_blank"
            rel="noreferrer"
          >
            Request access
          </Link>
        </Button>
      </div>
    </Card>
  );
}
