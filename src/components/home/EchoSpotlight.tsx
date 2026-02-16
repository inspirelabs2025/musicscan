import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music2, Sparkles, BookOpen, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
const echoAvatar = '/magic-mike-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

export function EchoSpotlight() {
  const isMobile = useIsMobile();
  const { tr } = useLanguage();
  const h = tr.homeUI;
  
  return (
    <section className="py-6 md:py-8 bg-gradient-to-br from-background via-green-50/30 to-red-50/20 dark:via-green-950/10 dark:to-red-950/10">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-2 border-green-500/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              {/* Left: Avatar + Intro */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <img 
                  src={echoAvatar} 
                  alt={h.echoAlt} 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-echo-lavender/50 shadow-lg"
                />
                <div className="md:hidden">
                   <h3 className="font-bold text-lg">Magic Mike</h3>
                   <p className="text-sm text-muted-foreground">{h.echoRole}</p>
                </div>
              </div>

              {/* Center: Content */}
              <div className="flex-1 space-y-3">
                <div className="hidden md:block">
                  <h3 className="font-bold text-xl mb-1">{h.echoTitle}</h3>
                  <p className="text-sm text-muted-foreground italic">
                    {h.echoQuoteDesktop}
                  </p>
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-echo-lavender/10 text-xs font-medium">
                    <Sparkles className="w-3 h-3 text-echo-lavender" />
                    {h.echoMusicHistory}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-echo-gold/10 text-xs font-medium">
                    <BookOpen className="w-3 h-3 text-echo-gold" />
                    {h.echoAlbumStories}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/10 text-xs font-medium">
                    <Heart className="w-3 h-3 text-red-600" />
                    {h.echoMemories}
                  </span>
                </div>

                {/* Mobile quote */}
                <p className="md:hidden text-sm text-muted-foreground italic">
                  {h.echoQuoteMobile}
                </p>
              </div>

              {/* Right: CTA */}
              <div className="flex-shrink-0">
                <Button 
                  asChild 
                  size={isMobile ? "default" : "lg"}
                  className="w-full md:w-auto bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90 hover:shadow-lg transition-all"
                >
                  <Link to="/echo">
                    <Music2 className="w-4 h-4 mr-2" />
                    {h.echoCTA}
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
