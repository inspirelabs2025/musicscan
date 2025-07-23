import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { Button } from '@/components/ui/button';

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
    </div>
  );
};

export default Home;