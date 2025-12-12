import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ChristmasCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isChristmas, setIsChristmas] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let christmas = new Date(currentYear, 11, 25, 0, 0, 0); // December 25

      // If Christmas has passed this year, calculate for next year
      if (now > christmas) {
        christmas = new Date(currentYear + 1, 11, 25, 0, 0, 0);
      }

      const difference = christmas.getTime() - now.getTime();

      if (difference <= 0) {
        setIsChristmas(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative bg-gradient-to-b from-red-600 to-red-800 text-white rounded-lg px-4 py-3 min-w-[70px] shadow-lg">
        <span className="text-3xl md:text-4xl font-bold tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-red-900/50" />
      </div>
      <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  if (isChristmas) {
    return (
      <motion.div 
        className="text-center py-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl md:text-8xl mb-4"
        >
          🎄
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-bold text-red-600">
          Vrolijk Kerstfeest!
        </h2>
        <p className="text-muted-foreground mt-2">Geniet van de feestdagen!</p>
      </motion.div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-lg md:text-xl font-semibold mb-4 text-muted-foreground">
        ⏰ Aftellen tot Kerst
      </h3>
      <div className="flex justify-center gap-3 md:gap-4">
        <TimeBlock value={timeLeft.days} label="Dagen" />
        <TimeBlock value={timeLeft.hours} label="Uren" />
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};

export default ChristmasCountdown;
