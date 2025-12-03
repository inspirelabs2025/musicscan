import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award } from 'lucide-react';

interface AwardItem {
  category: string;
  winner: string;
}

interface AwardsSectionProps {
  narrative: string;
  grammy: AwardItem[];
  brit_awards: AwardItem[];
  edison: AwardItem[];
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ 
  narrative, 
  grammy, 
  brit_awards, 
  edison 
}) => {
  const hasAwards = grammy?.length > 0 || brit_awards?.length > 0 || edison?.length > 0;
  
  if (!narrative && !hasAwards) return null;

  const AwardList = ({ title, awards, icon }: { title: string; awards: AwardItem[]; icon: string }) => {
    if (!awards || awards.length === 0) return null;
    
    // Filter out any "Nog niet bekend" entries
    const validAwards = awards.filter(a => 
      a.winner && 
      !a.winner.toLowerCase().includes('nog niet bekend') &&
      !a.winner.toLowerCase().includes('niet bekend') &&
      !a.winner.toLowerCase().includes('unknown')
    );
    
    if (validAwards.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {title}
        </h3>
        <ul className="space-y-2">
          {validAwards.slice(0, 8).map((award, index) => (
            <li key={index} className="text-sm py-2 px-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground text-xs block">{award.category}</span>
              <span className="font-medium">{award.winner}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          🏆 Awards & Prijzen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {narrative && !narrative.toLowerCase().includes('onbeschreven blad') && (
          <p className="text-muted-foreground leading-relaxed">{narrative}</p>
        )}
        
        <div className="grid md:grid-cols-3 gap-6">
          <AwardList title="Grammy Awards" awards={grammy} icon="🇺🇸" />
          <AwardList title="Brit Awards" awards={brit_awards} icon="🇬🇧" />
          <AwardList title="Edison Awards" awards={edison} icon="🇳🇱" />
        </div>
      </CardContent>
    </Card>
  );
};
