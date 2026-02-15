import { useSEO } from '@/hooks/useSEO';
import { Music, Heart, Sparkles, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { tr } = useLanguage();
  const a = tr.about;

  useSEO({
    title: a.metaTitle,
    description: a.metaDesc,
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
              <span className="text-sm font-semibold text-primary">{a.madeWithPassion}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-vinyl-purple via-vinyl-gold to-primary bg-clip-text text-transparent">
              {a.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              {a.heroSubtitle}
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
                    <h2 className="text-3xl font-bold mb-4">{a.aboutRogierTitle}</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="leading-relaxed">{a.aboutRogierP1}</p>
                  <p className="leading-relaxed">{a.aboutRogierP2}</p>
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
                    <h2 className="text-3xl font-bold mb-4">{a.howItStartedTitle}</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="text-xl font-semibold text-vinyl-gold">{a.howItStartedHighlight}</p>
                  <p className="leading-relaxed">{a.howItStartedP1}</p>
                  <p className="leading-relaxed">{a.howItStartedP2}</p>
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
                    <h2 className="text-3xl font-bold mb-4">{a.whyTitle}</h2>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
                  <p className="leading-relaxed">{a.whyP1}</p>
                  <p className="leading-relaxed"><strong>{a.whyP2}</strong></p>
                  <p className="leading-relaxed">{a.whyP3}</p>
                </div>
              </CardContent>
            </Card>

            {/* Final Message */}
            <div className="text-center py-12 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-vinyl-purple via-vinyl-gold to-primary bg-clip-text text-transparent">
                {a.welcomeTitle}
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {a.welcomeSubtitle}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-8">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <span>{a.madeByRogier}</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
