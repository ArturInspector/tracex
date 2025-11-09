'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function SpeedEffects() {
  const [speedLines, setSpeedLines] = useState<Array<{ id: number; delay: number; left: number }>>([]);
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; left: number }>>([]);
  const [showRockets, setShowRockets] = useState(false);

  useEffect(() => {
    // Create speed lines - оптимизировано количество
    const lines = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      left: Math.random() * 100,
    }));
    setSpeedLines(lines);

    // Create particles - оптимизировано количество
    const parts = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      left: Math.random() * 100,
    }));
    setParticles(parts);

    // Показываем ракеты после загрузки страницы
    const timer = setTimeout(() => {
      setShowRockets(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Speed lines */}
      {speedLines.map((line) => (
        <div
          key={line.id}
          className="speed-line"
          style={{
            left: `${line.left}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${line.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Rocket - летает по экрану, появляется после загрузки */}
      {showRockets && (
        <>
          <div className="fixed top-1/4 left-0 z-20 rocket" style={{ animationDelay: '0s' }}>
            <div className="relative">
              {/* Rocket trail - длинный след */}
              <div className="rocket-trail" style={{ top: '50%', left: '-200px', width: '300px' }} />
              {/* Rocket image */}
              <div className="relative w-20 h-20 md:w-32 md:h-32">
                <Image
                  src="/images/rocket.png"
                  alt="Rocket"
                  fill
                  className="object-contain"
                  priority
                />
                {/* Свечение вокруг ракеты */}
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl -z-10 animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Вторая ракета для большего эффекта */}
          <div className="fixed top-3/4 left-0 z-20 rocket" style={{ animationDelay: '6s' }}>
            <div className="relative">
              <div className="rocket-trail" style={{ top: '50%', left: '-200px', width: '300px' }} />
              <div className="relative w-16 h-16 md:w-24 md:h-24 opacity-70">
                <Image
                  src="/images/rocket.png"
                  alt="Rocket"
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-lg -z-10" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

