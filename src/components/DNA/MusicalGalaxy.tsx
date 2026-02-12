
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MusicalGalaxyProps {
  chartData: any;
  analysis: any;
}

export function MusicalGalaxy({ chartData, analysis }: MusicalGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { isMobile, isTablet } = useMobileDetection();
  
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

    // Adjust parameters based on device type
    const orbitBaseRadius = isMobile ? 80 : isTablet ? 100 : 120;
    const orbitSpacing = isMobile ? 8 : isTablet ? 12 : 15;
    const basePlanetSize = isMobile ? 2 : isTablet ? 2.5 : 3;
    const maxPlanetSize = isMobile ? 25 : isTablet ? 35 : 40;
    const minPlanetSize = isMobile ? 10 : isTablet ? 12 : 15;

    // Create "planets" for each genre
    const planets = chartData.genreDistribution?.slice(0, isMobile ? 6 : 8).map((genre: any, index: number) => ({
      name: genre.name,
      size: Math.max(Math.min(genre.value * basePlanetSize, maxPlanetSize), minPlanetSize),
      x: (canvas.clientWidth / 2) + Math.cos((index / (isMobile ? 6 : 8)) * Math.PI * 2) * (orbitBaseRadius + (index * orbitSpacing)),
      y: (canvas.clientHeight / 2) + Math.sin((index / (isMobile ? 6 : 8)) * Math.PI * 2) * (orbitBaseRadius + (index * orbitSpacing)),
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316'][index],
      angle: (index / (isMobile ? 6 : 8)) * Math.PI * 2,
      orbitRadius: orbitBaseRadius + (index * orbitSpacing),
      orbitSpeed: 0.0008 + (index * 0.0003)
    })) || [];

    let time = 0;

    const animate = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      
      // Clear canvas with fade trail
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Draw center (you) with pulsing effect
      const centerPulse = 1 + Math.sin(time * 0.01) * 0.1;
      const centerSize = isMobile ? 60 : isTablet ? 70 : 80;
      const centerCoreSize = isMobile ? 18 : isTablet ? 22 : 25;
      
      ctx.save();
      
      // Center glow
      const centerGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, centerSize * centerPulse);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      centerGradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.4)');
      centerGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, centerSize * centerPulse, 0, Math.PI * 2);
      ctx.fill();

      // Center core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, centerCoreSize * centerPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw planets (genres)
      planets.forEach((planet, index) => {
        // Update position
        planet.angle += planet.orbitSpeed;
        planet.x = (width / 2) + Math.cos(planet.angle) * planet.orbitRadius;
        planet.y = (height / 2) + Math.sin(planet.angle) * planet.orbitRadius;

        // Draw orbit path (lighter on mobile)
        ctx.save();
        ctx.strokeStyle = isMobile ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, planet.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Planet glow
        const gradient = ctx.createRadialGradient(
          planet.x, planet.y, 0,
          planet.x, planet.y, planet.size * 2.5
        );
        gradient.addColorStop(0, planet.color + '80');
        gradient.addColorStop(0.6, planet.color + '20');
        gradient.addColorStop(1, planet.color + '00');
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw planet
        ctx.save();
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();

        // Planet rim
        ctx.strokeStyle = planet.color + 'CC';
        ctx.lineWidth = isMobile ? 1 : 2;
        ctx.stroke();
        ctx.restore();

        // Draw connection to center (lighter on mobile)
        if (!isMobile) {
          ctx.save();
          ctx.strokeStyle = planet.color + '30';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(width / 2, height / 2);
          ctx.lineTo(planet.x, planet.y);
          ctx.stroke();
          ctx.restore();
        }

        // Draw label with background (smaller on mobile)
        ctx.save();
        ctx.font = `bold ${isMobile ? '10px' : '12px'} Inter, sans-serif`;
        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(planet.name).width;
        const labelY = planet.y + planet.size + (isMobile ? 20 : 25);
        
        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(planet.x - textWidth/2 - (isMobile ? 4 : 6), labelY - (isMobile ? 6 : 8), textWidth + (isMobile ? 8 : 12), isMobile ? 12 : 16);
        
        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(planet.name, planet.x, labelY);
        ctx.restore();
      });

      // Draw connecting lines between nearby planets (desktop only)
      if (!isMobile) {
        planets.forEach((planet1, i) => {
          planets.forEach((planet2, j) => {
            if (i >= j) return;
            
            const dx = planet1.x - planet2.x;
            const dy = planet1.y - planet2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (isTablet ? 150 : 180)) {
              ctx.save();
              ctx.globalAlpha = (distance < (isTablet ? 150 : 180) ? (isTablet ? 150 : 180) - distance : 0) / (isTablet ? 150 : 180) * 0.2;
              ctx.strokeStyle = '#8b5cf6';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(planet1.x, planet1.y);
              ctx.lineTo(planet2.x, planet2.y);
              ctx.stroke();
              ctx.restore();
            }
          });
        });
      }

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
  }, [chartData, isMobile, isTablet]);

  return (
    <Card variant="dark" className="hover:bg-white/10 transition-all">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          🌌 Your Musical Galaxy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`w-full rounded-xl ${
              isMobile ? 'h-64' : isTablet ? 'h-80' : 'h-96 md:h-[500px]'
            }`}
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.9))' }}
          />
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black/70 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 max-w-xs">
            <p className="text-white text-xs md:text-sm mb-1 md:mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></span>
              You are at the center
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              Each planet represents a genre in your collection. {!isMobile && 'Larger planets indicate more albums in that genre.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
