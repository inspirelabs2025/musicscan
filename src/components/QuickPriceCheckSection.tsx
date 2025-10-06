import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Camera, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export const QuickPriceCheckSection = () => {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-gradient-to-br from-background via-accent/3 to-background relative overflow-hidden">
      {/* Background Lightning Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-20 text-3xl animate-pulse">⚡</div>
        <div className="absolute top-20 right-10 text-2xl animate-pulse delay-300">💰</div>
        <div className="absolute bottom-20 left-10 text-3xl animate-pulse delay-700">⚡</div>
        <div className="absolute bottom-10 right-20 text-2xl animate-pulse delay-500">💰</div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
              Quick Price Check
            </h2>
            <Zap className="w-8 h-8 text-green-500 animate-pulse delay-300" />
          </div>
          <p className="text-muted-foreground text-lg">
            ⚡ Scan vliegensvlug een LP of CD en ontdek de waarde
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-yellow-500/50 hover-scale animate-fade-in hover:bg-gradient-to-br hover:from-yellow-500/5 hover:to-transparent">
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 via-green-500 to-yellow-500/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-yellow-500/30">
                  <Zap className="w-12 h-12 text-white group-hover:animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-bold mb-6 group-hover:text-yellow-600 transition-colors">
                  Krijg in een handomdraai je prijs
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50 group-hover:bg-yellow-500/10 transition-colors">
                    <Camera className="w-8 h-8 text-yellow-600" />
                    <p className="text-sm font-medium">Slechts 3 foto's nodig</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50 group-hover:bg-yellow-500/10 transition-colors">
                    <Clock className="w-8 h-8 text-green-600" />
                    <p className="text-sm font-medium">Resultaat in seconden</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50 group-hover:bg-yellow-500/10 transition-colors">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                    <p className="text-sm font-medium">Direct actuele marktwaarde</p>
                  </div>
                </div>
                
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full md:w-auto group-hover:shadow-lg bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-white"
                >
                  <Link to={user ? "/quick-price-check" : "/auth"}>
                    <Zap className="w-5 h-5 mr-2" />
                    Start Quick Check
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
