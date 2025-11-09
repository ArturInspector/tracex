'use client';

import { useEffect, useState } from 'react';

export function StarsBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Уменьшаем количество звезд для лучшей производительности
    const newStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, []);

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

