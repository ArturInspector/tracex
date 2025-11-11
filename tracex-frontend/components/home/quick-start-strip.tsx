import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const items = [
  {
    title: 'Install',
    description: 'npm i @arturinspector/tracex-logger',
  },
  {
    title: 'Init tracer',
    description: 'const tracer = new X402Tracer({ apiUrl, key })',
  },
  {
    title: 'Ship spans',
    description: 'span.wrap(async () => pay())',
  },
] as const;

export function QuickStartStrip() {
  return (
    <section className="relative z-10 px-4 py-16">
      <Card className="max-w-6xl mx-auto bg-gradient-to-r from-[#0A1027]/90 via-[#0D1231]/85 to-[#0A1027]/90 border border-purple-500/20 backdrop-blur-2xl">
        <div className="flex flex-col gap-10 px-6 py-10 md:px-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <Badge className="bg-purple-500/15 text-purple-200 border-purple-500/40 uppercase tracking-[0.35em]">
                Quick start
              </Badge>
              <h3 className="text-2xl md:text-3xl font-semibold text-white mt-3">
                Three moves to production-grade telemetry
              </h3>
            </div>
            <Badge variant="outline" className="text-emerald-200 border-emerald-400/40">
              {'<'} 1ms per span
            </Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-black/25 p-5">
                <div className="text-sm font-mono text-purple-300/80 mb-2">{item.title}</div>
                <p className="text-sm md:text-base text-purple-100/80 break-words leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

