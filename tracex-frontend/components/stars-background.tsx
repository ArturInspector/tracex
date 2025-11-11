'use client';

import { useEffect, useState } from 'react';

export function StarsBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateIsMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile);
    } else {
      mediaQuery.addListener(updateIsMobile);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateIsMobile);
      } else {
        mediaQuery.removeListener(updateIsMobile);
      }
    };
  }, []);

  useEffect(() => {
    const starCount = isMobile ? 35 : 80;
    const newStars = Array.from({ length: starCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, [isMobile]);

  return (
    <div className="stars">
      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

