import { TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { Calendar, MapPin, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeMachineHeroProps {
  event: TimeMachineEvent;
}

export function TimeMachineHero({ event }: TimeMachineHeroProps) {
  const formattedDate = new Date(event.concert_date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background poster with parallax effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
      >
        {event.poster_image_url ? (
          <img
            src={event.poster_image_url}
            alt={`${event.artist_name} at ${event.venue_name}`}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </motion.div>

      {/* Floating musical notes animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ 
              y: '-100%', 
              opacity: [0, 1, 1, 0],
              x: [0, 30, -20, 0]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'easeInOut'
            }}
            className="absolute"
            style={{ 
              left: `${10 + i * 15}%`,
              fontSize: `${20 + i * 5}px`
            }}
          >
            <Music2 className="text-primary/20" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="container mx-auto px-4 pb-12">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-3xl"
          >
            <p className="text-primary font-semibold mb-2 text-sm tracking-widest uppercase">
              🕰️ Music Time Machine
            </p>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
              {event.event_title}
            </h1>
            
            {event.event_subtitle && (
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 italic">
                {event.event_subtitle}
              </p>
            )}

            <div className="flex flex-wrap gap-6 text-foreground/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{event.venue_name}, {event.venue_city}</span>
              </div>
              {event.tour_name && (
                <div className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">{event.tour_name}</span>
                </div>
              )}
            </div>

            {event.attendance_count && (
              <p className="mt-4 text-sm text-muted-foreground">
                ~{event.attendance_count.toLocaleString()} bezoekers aanwezig
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
