
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MusicalGalaxyProps {
  chartData: any;
  analysis: any;
}

export function MusicalGalaxy({ chartData, analysis }: MusicalGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create "planets" for each genre
    const planets = chartData.genreDistribution?.slice(0, 8).map((genre: any, index: number) => ({
      name: genre.name,
      size: Math.max(genre.value * 2, 20),
      x: (canvas.clientWidth / 2) + Math.cos((index / 8) * Math.PI * 2) * 150,
      y: (canvas.clientHeight / 2) + Math.sin((index / 8) * Math.PI * 2) * 150,
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6'][index],
      angle: (index / 8) * Math.PI * 2,
      orbitRadius: 150 + (index * 20),
      orbitSpeed: 0.001 + (index * 0.0005)
    })) || [];

    let time = 0;

    const animate = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Draw center (you)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow to center
      const centerGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 60);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw planets (genres)
      planets.forEach((planet, index) => {
        // Update position
        planet.angle += planet.orbitSpeed;
        planet.x = (width / 2) + Math.cos(planet.angle) * planet.orbitRadius;
        planet.y = (height / 2) + Math.sin(planet.angle) * planet.orbitRadius;

        // Draw orbit path
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, planet.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Draw planet
        ctx.save();
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();

        // Add planet glow
        const gradient = ctx.createRadialGradient(
          planet.x, planet.y, 0,
          planet.x, planet.y, planet.size * 2
        );
        gradient.addColorStop(0, planet.color + '80');
        gradient.addColorStop(1, planet.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection to center
        ctx.save();
        ctx.strokeStyle = planet.color + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(planet.x, planet.y);
        ctx.stroke();
        ctx.restore();

        // Draw label
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, planet.x, planet.y + planet.size + 15);
        ctx.restore();

        ctx.restore();
      });

      // Draw connecting lines between nearby planets
      planets.forEach((planet1, i) => {
        planets.forEach((planet2, j) => {
          if (i >= j) return;
          
          const dx = planet1.x - planet2.x;
          const dy = planet1.y - planet2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.save();
            ctx.globalAlpha = (200 - distance) / 200 * 0.3;
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(planet1.x, planet1.y);
            ctx.lineTo(planet2.x, planet2.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chartData]);

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🌌 Your Musical Galaxy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-96 rounded-lg"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.8))' }}
          />
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white text-sm">
              <span className="inline-block w-3 h-3 bg-white rounded-full mr-2"></span>
              You are at the center
            </p>
            <p className="text-white/70 text-xs mt-1">
              Each planet represents a genre in your collection
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
