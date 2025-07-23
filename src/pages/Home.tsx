import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Camera, Disc, Music } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Header with login/signup buttons */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Music Scan</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Inloggen
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                <UserPlus className="w-4 h-4 mr-2" />
                Registreren
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Scan Options Section */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Start met scannen</h2>
            <p className="text-muted-foreground text-lg">Kies je media type en begin direct met het scannen van je collectie</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Vinyl Scan Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-vinyl-purple/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-purple to-vinyl-purple/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Disc className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Vinyl Scannen</h3>
                <p className="text-muted-foreground mb-6">
                  Scan je vinyl platen door foto's te maken van voorkant, achterkant en matrix. 
                  Onze AI herkent automatisch alle details.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link to="/auth">
                    <Camera className="w-5 h-5 mr-2" />
                    Start Vinyl Scan
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* CD Scan Option */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-vinyl-gold/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-gold to-vinyl-gold/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">CD Scannen</h3>
                <p className="text-muted-foreground mb-6">
                  Scan je CD's door foto's te maken van voorkant, achterkant, barcode en matrix. 
                  Krijg direct prijsinformatie van Discogs.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link to="/auth">
                    <Camera className="w-5 h-5 mr-2" />
                    Start CD Scan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Al een account? <Link to="/auth" className="text-primary hover:underline">Log direct in</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;