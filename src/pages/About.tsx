import { useSEO } from '@/hooks/useSEO';
import { Music, Heart, Sparkles, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  useSEO({
    title: "Over MusicScan - De Verhalen Achter de Muziek",
    description: "Ontmoet Rogier, de maker van MusicScan.app. Een platform waar muziek, technologie en storytelling samenkomen. Waar elke plaat een verhaal heeft.",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/10 via-vinyl-gold/5 to-primary/5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Made with Passion</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-vinyl-purple via-vinyl-gold to-primary bg-clip-text text-transparent">
              Over MusicScan
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Waar muziek, technologie en storytelling samenkomen
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Introduction Card */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Over Rogier – de maker achter MusicScan.app</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="leading-relaxed">
                    MusicScan.app is geboren uit mijn levenslange liefde voor muziek. Niet alleen het luisteren, maar vooral het vastleggen van verhalen. Al sinds mijn jeugd ben ik gefascineerd door albums, cd's, vinylhoezen en de verhalen die achter elke plaat verscholen liggen. Muziek is voor mij nooit zomaar geluid geweest – het is een tijdmachine, een museum, een emotie-oproepende kracht die je terugbrengt naar momenten, mensen of plekken die je bijna vergeten was.
                  </p>
                  
                  <p className="leading-relaxed">
                    Naast ondernemer ben ik ook podcaster. Door mijn muziekpodcast leerde ik hoe bijzonder het is om muziekverhalen te delen: waarom een artiest een album maakte, hoe een nummer ontstond, hoe fans een plaat beleven. Diezelfde magie wilde ik vangen in iets dat verder gaat dan geluid alleen – iets visueels, tastbaars, doorzoekbaars.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mission Card */}
            <Card className="border-2 border-vinyl-gold/30 bg-gradient-to-br from-vinyl-gold/5 to-background">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-vinyl-gold/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-vinyl-gold" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Zo ontstond MusicScan.app</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="text-xl font-semibold text-vinyl-gold">
                    Een plek waar muziek, technologie en storytelling samenkomen.
                  </p>
                  
                  <p className="leading-relaxed">
                    Ik wilde een platform creëren voor iedereen die net als ik meer ziet in een album dan alleen een tracklist. Een plek waar je je collectie kunt scannen, waar je nieuwe muziekverhalen ontdekt, waar AI je helpt om context te vinden, herinneringen vast te leggen en zelfs om prachtige prints van je favoriete albums te maken.
                  </p>
                  
                  <p className="leading-relaxed">
                    MusicScan is mijn eerbetoon aan de kracht van muziek – aan de platen die we grijs draaien, de artiesten die ons raken en de verhalen die we nooit mogen vergeten.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Touch Card */}
            <Card className="border-2 border-vinyl-purple/30 bg-gradient-to-br from-vinyl-purple/5 to-background">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-vinyl-purple/20 flex items-center justify-center shrink-0">
                    <Headphones className="w-6 h-6 text-vinyl-purple" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Waarom ik dit doe</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="leading-relaxed">
                    En eerlijk? Ik bouw dit niet alleen voor anderen.
                  </p>
                  
                  <p className="leading-relaxed">
                    Ik bouw dit vooral omdat <strong>muziek mij al mijn hele leven inspireert</strong>.
                  </p>
                  
                  <p className="leading-relaxed">
                    Dit is mijn manier om iets terug te geven aan de community waar ik zoveel van hou.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Final Message */}
            <div className="text-center py-12 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-vinyl-purple via-vinyl-gold to-primary bg-clip-text text-transparent">
                Welkom bij MusicScan
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Waar elke plaat een verhaal heeft – en jij dat verhaal kunt bewaren.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-8">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <span>Met liefde gemaakt door Rogier</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
