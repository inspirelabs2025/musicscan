
import React from 'react';
import { Disc3, Camera, Brain, DollarSign, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
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
            <span className="bg-gradient-vinyl bg-clip-text text-transparent">
              AI Foto Analyse
            </span>
            <br />
            <span className="text-foreground">ontdek supersnel de juiste release ID</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload foto's van je vinyl en CD's, laat onze AI de details herkennen en krijg directe prijsschattingen van Discogs marketplace
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Camera className="w-4 h-4 mr-2" />
              Foto analyse
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Brain className="w-4 h-4 mr-2" />
              AI herkenning
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Live prijzen
            </Badge>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
          <Card className="text-center border-accent/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-vinyl-purple mb-2">10,000+</div>
              <div className="text-sm text-muted-foreground">Items gescand</div>
            </CardContent>
          </Card>
          <Card className="text-center border-accent/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-vinyl-gold mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Nauwkeurigheid</div>
            </CardContent>
          </Card>
          <Card className="text-center border-accent/20">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">€2.5M</div>
              <div className="text-sm text-muted-foreground">Gewaardeerde collecties</div>
            </CardContent>
          </Card>
        </div>

        {/* How it works section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Zo werkt het in 3 eenvoudige stappen
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Foto's maken</h3>
              <p className="text-muted-foreground">
                Upload duidelijke foto's van je vinyl of CD. Voor vinyl: voorkant, achterkant en matrix. Voor CD's: voorkant, achterkant, barcode en matrix.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. AI Analyse</h3>
              <p className="text-muted-foreground">
                Onze geavanceerde AI analyseert je foto's en herkent automatisch artiest, titel, label, catalogusnummer en andere belangrijke details.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Prijscheck</h3>
              <p className="text-muted-foreground">
                Krijg direct actuele prijzen van Discogs marketplace, inclusief adviesprijs op basis van conditie en marktwaarde.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
