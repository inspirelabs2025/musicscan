import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Calendar } from 'lucide-react';

interface TourInfo {
  artist: string;
  tour_name: string;
  gross?: number;
}

interface ToursFestivalsSectionProps {
  narrative: string;
  biggestTours: TourInfo[];
  festivals: string[];
}

export const ToursFestivalsSection: React.FC<ToursFestivalsSectionProps> = ({ 
  narrative, 
  biggestTours,
  festivals 
}) => {
  if (!narrative && biggestTours?.length === 0 && festivals?.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-purple-500" />
          🎪 Tours & Festivals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground">{narrative}</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Biggest Tours */}
          {biggestTours && biggestTours.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🎤 Grootste Tours
              </h3>
              <div className="space-y-3">
                {biggestTours.slice(0, 5).map((tour, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <div className="font-medium text-sm">{tour.artist}</div>
                    <div className="text-xs text-muted-foreground">{tour.tour_name}</div>
                    {tour.gross && (
                      <div className="text-xs text-green-500 mt-1">
                        ${(tour.gross / 1000000).toFixed(1)}M omzet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Festivals */}
          {festivals && festivals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🎉 Festivals
              </h3>
              <div className="flex flex-wrap gap-2">
                {festivals.slice(0, 10).map((festival, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 text-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full"
                  >
                    {festival}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
