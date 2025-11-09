'use client';

export function FloatingAlien() {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 animate-float">
      <div className="relative w-20 h-20 md:w-32 md:h-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse-glow" />
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Alien head shape */}
          <div className="relative">
            <div className="w-10 h-12 md:w-16 md:h-20 bg-gradient-to-b from-purple-600/30 to-cyan-600/30 rounded-t-full border border-purple-500/50 backdrop-blur-sm" />
            {/* Eyes */}
            <div className="absolute top-2 left-1.5 md:top-4 md:left-2 w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" />
            <div className="absolute top-2 right-1.5 md:top-4 md:right-2 w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            {/* Antenna */}
            <div className="absolute -top-2 md:-top-4 left-1/2 -translate-x-1/2 w-0.5 md:w-1 h-2 md:h-4 bg-purple-400/50" />
            <div className="absolute -top-3 md:-top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-sparkle" />
          </div>
        </div>
        <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs text-purple-300 font-mono hidden sm:block">
          &quot;Logs faster than light&quot;
        </div>
      </div>
    </div>
  );
}
