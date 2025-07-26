import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Camera, Disc, Music, User, ChevronDown, Sparkles, MessageSquare, TrendingUp, Headphones, Zap } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { NewUsersSection } from '@/components/NewUsersSection';
import { LatestAlbumsSection } from '@/components/LatestAlbumsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
const Home = () => {
  console.log('🏠 Home.tsx: Rendering Home component');
  
  const {
    user,
    loading,
    signOut
  } = useAuth();
  
  console.log('🏠 Home.tsx: Auth state -', { user: !!user, loading });
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background relative overflow-hidden">
      {/* Musical Background Elements */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-pulse">🎵</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-1000">🎼</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">🎸</div>
        <div className="absolute top-60 left-1/2 text-2xl animate-pulse delay-300">🥁</div>
      </div>

      {/* Header with conditional auth buttons */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover-scale">
              <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer transition-all duration-300 hover:drop-shadow-lg" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? <div className="w-20 h-10 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md" /> : user ? <Button asChild variant="ghost" className="hover-scale">
                <Link to="/scanner" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  🎯 Account
                </Link>
              </Button> : <>
                <Button asChild variant="ghost" className="hover-scale">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    🎪 Inloggen
                  </Link>
                </Button>
                <Button asChild className="hover-scale bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:shadow-lg">
                  <Link to="/auth">
                    <UserPlus className="w-4 h-4 mr-2" />
                    ✨ Registreren
                  </Link>
                </Button>
              </>}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Scan Options Section */}
      <section className="py-16 bg-gradient-to-r from-accent/10 via-background to-accent/10 relative">
        {/* Floating Music Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 animate-pulse delay-200">🎺</div>
          <div className="absolute top-20 right-1/4 animate-pulse delay-600">🎻</div>
          <div className="absolute bottom-20 left-1/3 animate-pulse delay-400">🎹</div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Camera className="w-8 h-8 text-vinyl-purple animate-pulse" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
                🚀 Start je Muziekavontuur
              </h2>
              <Camera className="w-8 h-8 text-vinyl-gold animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-lg">
              📸 Maak foto's, ontdek schatten - laat de magie beginnen! ✨
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Vinyl Scan Option */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-vinyl-purple/50 hover-scale animate-fade-in hover:bg-gradient-to-br hover:from-vinyl-purple/5 hover:to-transparent">
              <CardContent className="p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/10 via-transparent to-vinyl-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-purple to-vinyl-purple/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vinyl-purple/40">
                    <Disc className="w-10 h-10 text-white group-hover:animate-spin" />
                    <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-vinyl-purple transition-colors">
                    🎵 Vinyl Treasure Hunt
                  </h3>
                  <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">Ontdek je vinyl! Scan voorkant, achterkant en matrix - onze AI onthult de albums, waarde en specificaties. 💎🎶</p>
                  <Button asChild size="lg" className="w-full hover:shadow-lg group-hover:shadow-vinyl-purple/30">
                    <Link to={user ? "/scanner" : "/auth"}>
                      <Camera className="w-5 h-5 mr-2" />
                      🔍 Ontdek Vinyl Magie
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CD Scan Option */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-vinyl-gold/50 hover-scale animate-fade-in delay-200 hover:bg-gradient-to-br hover:from-vinyl-gold/5 hover:to-transparent">
              <CardContent className="p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-vinyl-gold/10 via-transparent to-vinyl-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-vinyl-gold to-vinyl-gold/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vinyl-gold/40">
                    <Music className="w-10 h-10 text-white group-hover:animate-pulse" />
                    <Zap className="w-4 h-4 text-white absolute -bottom-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-vinyl-gold transition-colors">
                    💿 CD Schatten Zoeken
                  </h3>
                  <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">Van eerste druk tot limited edition - scan je CD's en krijg direct de waarde. Je collectie kent geen geheimen meer! 🏆💰</p>
                  <Button asChild size="lg" className="w-full hover:shadow-lg group-hover:shadow-vinyl-gold/30">
                    <Link to={user ? "/scanner" : "/auth"}>
                      <Camera className="w-5 h-5 mr-2" />
                      💫 Start CD Detective
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8 animate-fade-in delay-300">
            {!user && <p className="text-sm text-muted-foreground">
                🎪 Al een account? <Link to="/auth" className="text-primary hover:underline story-link font-semibold">Spring direct in de actie!</Link> ✨
              </p>}
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

      {/* Latest Albums Section */}
      <LatestAlbumsSection />

      {/* New Users Section */}
      <NewUsersSection />
    </div>;
};
export default Home;