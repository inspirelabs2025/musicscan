import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Disc, Music, Sparkles, MessageSquare, TrendingUp, Headphones, Zap } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { NewUsersSection } from '@/components/NewUsersSection';
import { LatestAlbumsSection } from '@/components/LatestAlbumsSection';
import { NewsSection } from '@/components/NewsSection';
import { MusicScanningSection } from '@/components/MusicScanningSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO, SEO_CONFIGS } from '@/hooks/useSEO';
import { BlogPreviewWidget } from '@/components/dashboard/BlogPreviewWidget';
import { AppStructuredData } from '@/components/SEO/StructuredData';

const Home = () => {
  console.log('🏠 Home.tsx: Rendering Home component');
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Apply SEO for home page
  useSEO(SEO_CONFIGS['/']);
  
  console.log('🏠 Home.tsx: Auth state -', { user: !!user, loading });

  // Show logged in users a different experience but don't auto-redirect
  // (they can still access the marketing home page if they want)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background relative overflow-hidden">
      {/* SEO Structured Data */}
      <AppStructuredData />
      
      {/* Musical Background Elements */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-pulse">🎵</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-1000">🎼</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">🎸</div>
        <div className="absolute top-60 left-1/2 text-2xl animate-pulse delay-300">🥁</div>
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Music Scanning Section */}
      <MusicScanningSection />


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
              🎵 Duik diep in je muzikale ziel met AI die écht begrijpt wat muziek voor jou betekent
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

      {/* News Section */}
      <NewsSection />
      
      {/* Blog/Verhalen Section */}
      <section className="py-16 bg-gradient-to-br from-accent/5 to-background">
        <div className="container mx-auto px-4">
          <BlogPreviewWidget />
        </div>
      </section>

      {/* New Users Section */}
      <NewUsersSection />
    </div>
  );
};
export default Home;