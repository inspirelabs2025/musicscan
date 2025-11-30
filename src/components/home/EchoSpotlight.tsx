import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music2, Sparkles, BookOpen, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import echoAvatar from '@/assets/echo-avatar.png';

export function EchoSpotlight() {
  const isMobile = useIsMobile();
  
  return (
    <section className="py-6 md:py-8 bg-gradient-to-br from-background via-echo-lavender/5 to-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-2 border-echo-lavender/30 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              {/* Left: Avatar + Intro */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <img 
                  src={echoAvatar} 
                  alt="Echo - Muziekexpert" 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-echo-lavender/50 shadow-lg"
                />
                <div className="md:hidden">
                  <h3 className="font-bold text-lg">Echo</h3>
                  <p className="text-sm text-muted-foreground">Muziekexpert</p>
                </div>
              </div>

              {/* Center: Content */}
              <div className="flex-1 space-y-3">
                <div className="hidden md:block">
                  <h3 className="font-bold text-xl mb-1">🎵 Praat met Echo, onze muziekexpert</h3>
                  <p className="text-sm text-muted-foreground italic">
                    "Ah — <em>Blue Train</em> van Coltrane. Elke noot hier voelt als een gebed in koper..."
                  </p>
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-echo-lavender/10 text-xs font-medium">
                    <Sparkles className="w-3 h-3 text-echo-lavender" />
                    Muziekgeschiedenis
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-echo-gold/10 text-xs font-medium">
                    <BookOpen className="w-3 h-3 text-echo-gold" />
                    Album Verhalen
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-vinyl-purple/10 text-xs font-medium">
                    <Heart className="w-3 h-3 text-vinyl-purple" />
                    Herinneringen
                  </span>
                </div>

                {/* Mobile quote */}
                <p className="md:hidden text-sm text-muted-foreground italic">
                  "Elke plaat heeft een verhaal te vertellen..."
                </p>
              </div>

              {/* Right: CTA */}
              <div className="flex-shrink-0">
                <Button 
                  asChild 
                  size={isMobile ? "default" : "lg"}
                  className="w-full md:w-auto bg-gradient-to-r from-vinyl-purple to-echo-lavender hover:opacity-90 hover:shadow-lg transition-all"
                >
                  <Link to="/echo">
                    <Music2 className="w-4 h-4 mr-2" />
                    Chat met Echo
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
