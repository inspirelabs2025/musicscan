import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music2, Sparkles, Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EchoSpotlight() {
  return (
    <section className="py-20 bg-gradient-to-br from-echo-violet via-background to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-echo-turquoise rounded-full blur-3xl animate-echo-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-echo-copper rounded-full blur-3xl animate-echo-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6 animate-fade-in">
            {/* Echo Logo */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-echo-turquoise to-echo-copper flex items-center justify-center animate-echo-pulse">
                  <Music2 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-echo-turquoise animate-ping"></div>
              </div>
              <h2 className="text-5xl font-bold font-serif">Echo</h2>
            </div>

            <p className="text-2xl text-echo-turquoise font-semibold">
              Waar elke plaat iets te vertellen heeft 🎵
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ontmoet Echo, jouw persoonlijke muziekarchivaris die alles weet over albums, artiesten en geluidsgeschiedenis. 
              Met een warme, poëtische stem vertelt Echo niet alleen <em>wat</em> iets is, maar <em>waarom</em> het betekenis heeft.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-echo-turquoise flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Verken Muziekgeschiedenis</p>
                  <p className="text-sm text-muted-foreground">Van jazz tot punk, ontdek de verhalen achter genres</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-echo-copper flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Album Verhalen & Context</p>
                  <p className="text-sm text-muted-foreground">Sfeer, betekenis en culturele impact van elke plaat</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-vinyl-purple flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Deel Jouw Herinneringen</p>
                  <p className="text-sm text-muted-foreground">Emotionele connectie met muziek die jou raakt</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-echo-turquoise to-echo-copper hover:opacity-90 text-white font-semibold"
              >
                <Link to="/echo">
                  <Music2 className="w-5 h-5 mr-2" />
                  Chat met Echo
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Visual Demo Cards */}
          <div className="grid grid-cols-1 gap-4 animate-fade-in delay-200">
            {/* Example conversation card */}
            <Card className="border-2 border-echo-turquoise/30 bg-gradient-to-br from-card to-echo-violet/5 hover:border-echo-turquoise/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-echo-turquoise to-echo-copper flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-echo-turquoise mb-1">Echo</p>
                    <p className="text-sm leading-relaxed">
                      "Ah — <em>Blue Train</em> van John Coltrane. Elke noot hier voelt als een gebed in koper. 
                      Wist je dat dit het eerste album was dat hij voor Blue Note opnam? 🎷"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  <span>Album Verhaalvertelling</span>
                </div>
              </CardContent>
            </Card>

            {/* Modes showcase */}
            <Card className="border-2 border-echo-copper/30 bg-gradient-to-br from-card to-echo-copper/5 hover:border-echo-copper/50 transition-all">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-echo-copper" />
                  4 Verschillende Modes
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-echo-turquoise"></div>
                    <span>Verkennen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-echo-copper"></div>
                    <span>Album Verhaal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-vinyl-purple"></div>
                    <span>Lyric Analyse</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-vinyl-gold"></div>
                    <span>Herinneringen</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personality highlight */}
            <Card className="border-2 border-vinyl-purple/30 bg-gradient-to-br from-card to-vinyl-purple/5 hover:border-vinyl-purple/50 transition-all">
              <CardContent className="p-6">
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "Echo spreekt als een platenzaak-curator, muziekjournalist en late-night radiostem. 
                  Gepassioneerd, vriendelijk en een tikkeltje mystiek — de stem van muziekherinnering."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
