import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Camera, Disc, Music, User, ChevronDown, Sparkles, MessageSquare, TrendingUp, Headphones, Zap } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Home = () => {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header with conditional auth buttons */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-10 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <Button asChild variant="ghost">
                <Link to="/scanner" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Account
                </Link>
              </Button>
            ) : (
              <>
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
              </>
            )}
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
                  <Link to={user ? "/scanner" : "/auth"}>
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
                  <Link to={user ? "/scanner" : "/auth"}>
                    <Camera className="w-5 h-5 mr-2" />
                    Start CD Scan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            {!user && (
              <p className="text-sm text-muted-foreground">
                Al een account? <Link to="/auth" className="text-primary hover:underline">Log direct in</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 bg-gradient-to-br from-background via-accent/5 to-background relative overflow-hidden">
        {/* Background Music Notes Animation */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 animate-pulse">♪</div>
          <div className="absolute top-20 right-20 animate-pulse delay-300">♫</div>
          <div className="absolute bottom-20 left-20 animate-pulse delay-700">♪</div>
          <div className="absolute bottom-10 right-10 animate-pulse delay-500">♫</div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-vinyl-purple animate-pulse" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
                Jouw Muziek DNA Ontrafelen
              </h2>
              <Sparkles className="w-8 h-8 text-vinyl-gold animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-lg">
              🎵 Duik diep in je muziekale ziel met AI die écht begrijpt wat muziek voor jou betekent
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* AI Analysis Feature */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-vinyl-purple/50 hover-scale animate-fade-in hover:bg-gradient-to-br hover:from-vinyl-purple/5 hover:to-transparent">
              <CardContent className="p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/10 via-transparent to-vinyl-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-purple via-primary to-vinyl-purple/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vinyl-purple/30">
                    <TrendingUp className="w-10 h-10 text-white group-hover:animate-pulse" />
                    <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-vinyl-purple transition-colors">
                    🎼 Muziekanalyse Magie
                  </h3>
                  <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">
                    Ontdek je muzikale vingerafdruk! Van vergeten pareltjes tot je favoriete genres - 
                    onze AI onthult de verhalen die je platen vertellen. 🔍✨
                  </p>
                  <Button asChild size="lg" className="w-full group-hover:shadow-lg">
                    <Link to={user ? "/ai-analysis" : "/auth"}>
                      <Zap className="w-5 h-5 mr-2" />
                      Ontdek Mijn Muziek DNA
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collection Chat Feature */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-vinyl-gold/50 hover-scale animate-fade-in delay-200 hover:bg-gradient-to-br hover:from-vinyl-gold/5 hover:to-transparent">
              <CardContent className="p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vinyl-gold/10 via-transparent to-vinyl-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-gold via-secondary to-vinyl-gold/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vinyl-gold/30">
                    <Headphones className="w-10 h-10 text-white group-hover:animate-pulse" />
                    <MessageSquare className="w-4 h-4 text-white absolute -bottom-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-vinyl-gold transition-colors">
                    🎧 Praat met je Platen
                  </h3>
                  <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">
                    "Welk album past bij mijn stemming?" "Wat is mijn zeldzaamste plaat?" 
                    Chat alsof je collectie je beste muziekvriend is! 🗣️🎶
                  </p>
                  <Button asChild size="lg" className="w-full group-hover:shadow-lg">
                    <Link to={user ? "/collection-chat" : "/auth"}>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Begin het Gesprek
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;