import React from 'react';
import { Disc3, Camera, Brain, DollarSign, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export const HeroSection = () => {
  return <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-vinyl-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-vinyl-gold/10 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-16">
        {/* Main Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-vinyl flex items-center justify-center animate-scan-pulse">
                <Disc3 className="w-8 h-8 text-white animate-vinyl-spin" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-vinyl-gold animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-vinyl bg-clip-text text-transparent">Het leukste muziekplatform</span>
            <br />
            <span className="text-vinyl-gold text-2xl md:text-3xl">Ontdek muziek op allerlei leuke manieren</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">Bekijk de laatste albums, het laatste nieuws, de leukste muziekverhalen, of bouw slim je eigen collectie, open een winkel of krijg inzicht en ontdek de waarde</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Brain className="w-4 h-4 mr-2" />
              Muziekanalyse
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Users className="w-4 h-4 mr-2" />
              Collectie Chat
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Prijsanalyses
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Muziekverhalen
            </Badge>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex justify-center gap-6 mb-16">
          <Card className="text-center border-accent/20 max-w-xs">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="text-3xl font-bold text-vinyl-purple mb-2">10,000+</div>
              <div className="text-sm text-muted-foreground">Items gescand</div>
            </CardContent>
          </Card>
          <Card className="text-center border-accent/20 max-w-xs">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="text-3xl font-bold text-vinyl-gold mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Muziekverhalen</div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>;
};