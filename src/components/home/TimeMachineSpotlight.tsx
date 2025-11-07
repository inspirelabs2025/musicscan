import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music2, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTimeMachineEvents } from '@/hooks/useTimeMachineEvents';

export function TimeMachineSpotlight() {
  const navigate = useNavigate();
  const { data: events } = useTimeMachineEvents({ published: true, featured: true, limit: 3 });

  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Nieuw: Time Machine
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            🕰️ Herleef Legendarische Concerten
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ontdek iconische momenten uit de muziekgeschiedenis. Elk event komt tot leven 
            met verhalen, setlists, archiefmateriaal en exclusieve limited edition posters.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
                onClick={() => navigate(`/time-machine/${event.slug}`)}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                  {event.poster_image_url ? (
                    <img
                      src={event.poster_image_url}
                      alt={event.event_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary">Featured</Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.event_title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(event.concert_date).getFullYear()}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={() => navigate('/time-machine')}
            className="bg-primary hover:bg-primary/90"
          >
            <Music2 className="w-4 h-4 mr-2" />
            Ontdek Alle Time Machine Events
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
