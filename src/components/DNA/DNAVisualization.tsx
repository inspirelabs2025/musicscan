
import React, { useEffect, useRef } from 'react';

interface DNAVisualizationProps {
  analysis?: any;
  isLoading?: boolean;
  className?: string;
}

export function DNAVisualization({ analysis, isLoading, className = "" }: DNAVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    opacity: number;
  }>>([]);

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

    // Initialize particles
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    particlesRef.current = Array.from({ length: isLoading ? 20 : 40 }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.8 + 0.2
    }));

    let time = 0;

    const animate = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx + Math.sin(time * 0.01 + i) * 0.5;
        particle.y += particle.vy + Math.cos(time * 0.01 + i) * 0.5;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color + '80');
        gradient.addColorStop(1, particle.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Connect nearby particles
        particlesRef.current.forEach((otherParticle, j) => {
          if (i >= j) return;
          
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = (100 - distance) / 100 * 0.3;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      // Draw DNA helix if not loading
      if (!isLoading && analysis) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < width; i += 5) {
          const y1 = height/2 + Math.sin((i + time * 2) * 0.02) * 30;
          const y2 = height/2 - Math.sin((i + time * 2) * 0.02) * 30;
          
          ctx.beginPath();
          ctx.moveTo(i, y1);
          ctx.lineTo(i + 5, y1);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(i, y2);
          ctx.lineTo(i + 5, y2);
          ctx.stroke();
          
          // Connect strands occasionally
          if (i % 20 === 0) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(i, y1);
            ctx.lineTo(i, y2);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
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
  }, [analysis, isLoading]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full rounded-lg ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}
    />
  );
}
