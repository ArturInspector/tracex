'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Home', hotkey: 'H', description: 'Hero & product USP' },
  { href: '/docs', label: 'Docs', hotkey: 'D', description: 'SDK integration' },
  { href: '/dashboard', label: 'Dashboard', hotkey: 'B', description: 'Live traces' },
  { href: '/compare', label: 'Compare', hotkey: 'C', description: 'Facilitator metrics' },
];

export function FloatingNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/docs')) {
    return null;
  }

  // Hide on home page to avoid overlap with hero buttons
  if (pathname === '/') {
    return null;
  }

  return (
    <>
      <nav className="fixed left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex z-50">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex flex-col items-start rounded-xl border border-transparent bg-black/30 px-4 py-3 text-left text-sm text-purple-200/80 transition-all hover:border-purple-500/50 hover:bg-purple-900/20',
                isActive && 'border-purple-400/70 bg-purple-900/30 text-white shadow-lg shadow-purple-500/20'
              )}
            >
              <span className="font-semibold tracking-wide">{item.label}</span>
              <span className="text-xs text-purple-300/60">{item.description}</span>
              <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-purple-500/50 bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono uppercase text-purple-100 group-hover:flex">
                {item.hotkey}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 lg:hidden">
        <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-purple-500/30 bg-black/40 p-2 backdrop-blur">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'flex-1 justify-center rounded-xl text-xs text-purple-200/80 hover:bg-purple-500/20',
                  isActive && 'bg-purple-500/30 text-white hover:bg-purple-500/30'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}


