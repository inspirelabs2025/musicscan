import { useEffect, useState } from 'react';

interface Ornament {
  id: number;
  left: number;
  top: number;
  size: number;
  color: 'red' | 'gold' | 'green';
  delay: number;
}

interface Light {
  id: number;
  left: number;
  color: 'red' | 'gold' | 'green' | 'white';
  delay: number;
}

export const ChristmasDecorations = () => {
  const [lights, setLights] = useState<Light[]>([]);

  useEffect(() => {
    // Create fairy lights across the top
    const lightArray: Light[] = [];
    const colors: Light['color'][] = ['red', 'gold', 'green', 'white'];
    
    for (let i = 0; i < 30; i++) {
      lightArray.push({
        id: i,
        left: (i / 30) * 100,
        color: colors[i % 4],
        delay: i * 0.1,
      });
    }
    
    setLights(lightArray);
  }, []);

  const getLightColor = (color: Light['color']) => {
    switch (color) {
      case 'red': return 'bg-red-500 shadow-red-400';
      case 'gold': return 'bg-yellow-400 shadow-yellow-300';
      case 'green': return 'bg-green-500 shadow-green-400';
      case 'white': return 'bg-white shadow-white';
    }
  };

  return (
    <>
      {/* Fairy lights at the very top */}
      <div className="fixed top-0 left-0 right-0 h-8 z-50 pointer-events-none overflow-hidden">
        <div className="absolute top-2 left-0 right-0 flex justify-between px-4">
          {lights.map((light) => (
            <div
              key={light.id}
              className={`w-2 h-3 rounded-full ${getLightColor(light.color)} animate-pulse shadow-lg`}
              style={{
                animationDelay: `${light.delay}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
        {/* Wire */}
        <svg className="absolute top-0 left-0 w-full h-8" viewBox="0 0 100 8" preserveAspectRatio="none">
          <path
            d="M0,2 Q5,4 10,2 Q15,0 20,2 Q25,4 30,2 Q35,0 40,2 Q45,4 50,2 Q55,0 60,2 Q65,4 70,2 Q75,0 80,2 Q85,4 90,2 Q95,0 100,2"
            fill="none"
            stroke="hsl(142 71% 25%)"
            strokeWidth="0.3"
          />
        </svg>
      </div>

      {/* Corner decorations */}
      <div className="fixed top-16 left-4 z-40 pointer-events-none opacity-60">
        <div className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🎄</div>
      </div>
      <div className="fixed top-16 right-4 z-40 pointer-events-none opacity-60">
        <div className="text-4xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>🎄</div>
      </div>

      {/* Floating ornaments */}
      <div className="fixed bottom-20 left-8 z-40 pointer-events-none opacity-50">
        <div className="text-3xl animate-pulse" style={{ animationDuration: '2s' }}>🎁</div>
      </div>
      <div className="fixed bottom-32 right-8 z-40 pointer-events-none opacity-50">
        <div className="text-3xl animate-pulse" style={{ animationDuration: '2s', animationDelay: '1s' }}>🔔</div>
      </div>
      <div className="fixed top-1/3 right-6 z-40 pointer-events-none opacity-40">
        <div className="text-2xl animate-twinkle">⭐</div>
      </div>
      <div className="fixed top-1/2 left-6 z-40 pointer-events-none opacity-40">
        <div className="text-2xl animate-twinkle" style={{ animationDelay: '1s' }}>✨</div>
      </div>
    </>
  );
};
