import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Users, MessageCirclePlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsHeroProps {
  onStartConversation?: () => void;
  onDiscoverUsers?: () => void;
}

export const QuickActionsHero: React.FC<QuickActionsHeroProps> = ({
  onStartConversation,
  onDiscoverUsers
}) => {
  const { tr } = useLanguage();
  const s = tr.socialUI;

  return (
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card via-card to-vinyl-purple/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-vinyl-purple animate-pulse" />
          {s.quickActions}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            size="lg" 
            className="h-20 bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80 hover:shadow-lg group"
            onClick={onDiscoverUsers}
          >
            <div className="flex flex-col items-center gap-2">
              <Search className="w-6 h-6 group-hover:animate-pulse" />
              <span>{s.discoverCollectors}</span>
            </div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-20 hover:bg-vinyl-gold/10 group"
            asChild
          >
            <Link to="/community">
              <div className="flex flex-col items-center gap-2">
                <Users className="w-6 h-6 group-hover:animate-pulse" />
                <span>{s.communityHub}</span>
              </div>
            </Link>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-20 hover:bg-accent/20 group"
            onClick={onStartConversation}
          >
            <div className="flex flex-col items-center gap-2">
              <MessageCirclePlus className="w-6 h-6 group-hover:animate-pulse" />
              <span>{s.newChat}</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
