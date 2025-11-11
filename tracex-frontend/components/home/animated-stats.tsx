'use client';

import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';

interface AnimatedStatProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
  highlight?: boolean;
}

function AnimatedStat({ 
  end, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  decimals = 0,
  label,
  highlight = false
}: AnimatedStatProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function для smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(end * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, hasStarted]);

  const formattedValue = count.toFixed(decimals);

  return (
    <div ref={elementRef} className="text-center">
      <div className={`text-2xl sm:text-3xl font-bold mb-1 font-mono ${
        highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400' : 'text-purple-300'
      }`}>
        {prefix}{formattedValue}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-purple-400/70">{label}</div>
    </div>
  );
}

export function AnimatedStats() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Симулируем "live" эффект
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-10">
        <AnimatedStat
          end={0.8}
          decimals={1}
          prefix="< "
          suffix="ms"
          label="Overhead per span"
          duration={2500}
        />
        <AnimatedStat
          end={9000}
          suffix="+"
          label="Spans per second"
          duration={3000}
          highlight
        />
        <AnimatedStat
          end={100}
          suffix="%"
          label="Non-blocking"
          duration={2000}
        />
        <AnimatedStat
          end={256}
          label="AES-256 Encrypted"
          duration={2500}
        />
      </div>
      
      <div className="mt-10 flex justify-center items-center gap-4">
        <Badge 
          variant="outline" 
          className={`border-white/20 text-white/70 uppercase tracking-[0.3em] px-5 py-2 transition-all duration-300 ${
            isLive ? 'border-green-400/40 text-green-300' : ''
          }`}
        >
          {isLive && <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />}
          Don't be blind in x402
        </Badge>
      </div>
    </>
  );
}

