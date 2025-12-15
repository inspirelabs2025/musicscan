import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export const SnowfallOverlay = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 12; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 10,
        size: 2 + Math.random() * 4,
        opacity: 0.2 + Math.random() * 0.3,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snowfall"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
          }}
        >
          <span className="text-white drop-shadow-lg" style={{ fontSize: flake.size * 2 }}>
            ❄
          </span>
        </div>
      ))}
    </div>
  );
};
