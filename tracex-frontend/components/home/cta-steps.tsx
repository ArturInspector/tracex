import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Drop the SDK',
    copy: 'Install the package. Start the tracer.',
    actionLabel: 'Repo',
    href: 'https://github.com/ArturInspector/tracex/tree/main/tracex/logger',
  },
  {
    title: 'Generate a key',
    copy: 'Use the dashboard to mint access.',
    actionLabel: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Tag your flows',
    copy: 'Send spans with X-Tag-X for quick grouping.',
    actionLabel: 'Docs',
    href: '/docs#tags',
  },
] as const;

export function HeroSteps() {
  return (
    <Card className="bg-[#070B19]/70 border border-purple-500/25 backdrop-blur-xl p-6 sm:p-9 lg:p-10 shadow-[0_22px_70px_rgba(88,28,135,0.22)]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-500/30 uppercase tracking-[0.3em]">
            3 Steps
          </Badge>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mt-3">Live telemetry in minutes</h3>
        </div>
        <Badge variant="outline" className="border-purple-400/40 text-purple-200">
          Hackathon ready
        </Badge>
      </div>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/5 rounded-xl px-5 py-4 bg-black/20"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-purple-300/80">{`0${index + 1}`}</span>
                <h4 className="text-lg font-semibold text-white">{step.title}</h4>
              </div>
              <p className="text-sm text-purple-100/70 mt-2 max-w-md">{step.copy}</p>
            </div>
            <Button variant="ghost" className="text-cyan-200 hover:text-white hover:bg-cyan-500/10" asChild>
              <Link href={step.href}>{step.actionLabel}</Link>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

