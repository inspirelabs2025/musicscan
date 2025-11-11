import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music2, Sparkles, Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import echoAvatar from '@/assets/echo-avatar.png';

export function EchoSpotlight() {
  return (
    <section className="py-16 bg-gradient-to-br from-background via-echo-lavender/5 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              🎵 Praat met Echo, onze muziekexpert
            </h2>
            <p className="text-xl text-muted-foreground">
              Waar elke plaat iets te vertellen heeft
            </p>
          </div>

          {/* Main showcase with split layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left: Features & Content */}
            <div className="flex flex-col justify-center space-y-6">
              {/* Features list */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-echo-lavender to-echo-gold flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Verken Muziekgeschiedenis</p>
                    <p className="text-sm text-muted-foreground">Van jazz tot punk, ontdek de verhalen achter genres</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-echo-gold to-echo-lavender flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Album Verhalen & Context</p>
                    <p className="text-sm text-muted-foreground">Sfeer, betekenis en culturele impact van elke plaat</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Deel Jouw Herinneringen</p>
                    <p className="text-sm text-muted-foreground">Emotionele connectie met muziek die jou raakt</p>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <Card className="bg-card p-6 border-2 border-echo-lavender/30">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={echoAvatar} 
                      alt="Echo - AI Muziekexpert" 
                      className="w-12 h-12 rounded-full border-2 border-echo-lavender/50 shadow-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">4 Verschillende Modes</h3>
                    <p className="text-sm text-muted-foreground">
                      Verkennen · Album Verhaal · Lyric Analyse · Herinneringen
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic border-t pt-3 mt-3">
                  Echo spreekt als een platenzaak-curator, muziekjournalist en late-night radiostem — 
                  de stem van muziekherinnering.
                </p>
              </Card>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-lg hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Link to="/echo">
                    <Music2 className="w-5 h-5 mr-2" />
                    Chat met Echo
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Example Conversation */}
            <div className="space-y-4">
              <Card className="border-2 border-echo-lavender/30 hover:border-echo-lavender/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={echoAvatar} 
                        alt="Echo" 
                        className="w-10 h-10 rounded-full border-2 border-echo-lavender/50 shadow-md"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-echo-lavender mb-1">Echo</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
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

              <Card className="border-2 border-echo-gold/30 hover:border-echo-gold/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={echoAvatar} 
                        alt="Echo" 
                        className="w-10 h-10 rounded-full border-2 border-echo-gold/50 shadow-md"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-echo-gold mb-1">Echo</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        "Die basslijn in '<em>Superstition</em>' — dat is Stevie Wonder's eigen groove, 
                        gespeeld op een Moog synthesizer. Pure magie uit 1972. 🎹"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3 h-3" />
                    <span>Muziekgeschiedenis</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-vinyl-purple/30 hover:border-vinyl-purple/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={echoAvatar} 
                        alt="Echo" 
                        className="w-10 h-10 rounded-full border-2 border-vinyl-purple/50 shadow-md"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-vinyl-purple mb-1">Echo</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        "Wat een prachtige herinnering! '<em>Wish You Were Here</em>' met je vader — 
                        zo'n moment maakte die plaat voor altijd deel van jullie verhaal. 💫"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3" />
                    <span>Persoonlijke Herinneringen</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
