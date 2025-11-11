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
  usePathname(); // still call to keep client component happy
  return null;
}


