import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { TourInfo, FestivalInfo } from '@/hooks/useYearOverview';

interface ToursFestivalsSectionProps {
  narrative: string;
  biggestTours: TourInfo[];
  festivals: (string | FestivalInfo)[];
  venueRecords?: string[];
}

export const ToursFestivalsSection: React.FC<ToursFestivalsSectionProps> = ({ 
  narrative, 
  biggestTours,
  festivals,
  venueRecords
}) => {
  if (!narrative && biggestTours?.length === 0 && festivals?.length === 0) return null;

  const getFestivalName = (festival: string | FestivalInfo): string => {
    if (typeof festival === 'string') return festival;
    return festival.name;
  };

  const getFestivalDetails = (festival: string | FestivalInfo) => {
    if (typeof festival === 'string') return null;
    return festival;
  };

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
                {biggestTours.slice(0, 6).map((tour, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <div className="font-medium text-sm">{tour.artist}</div>
                    <div className="text-xs text-muted-foreground">{tour.tour_name}</div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      {(tour.gross_millions || tour.gross) && (
                        <span className="text-green-500">
                          ${tour.gross_millions || (tour.gross ? (tour.gross / 1000000).toFixed(1) : 0)}M omzet
                        </span>
                      )}
                      {tour.shows && (
                        <span className="text-muted-foreground">{tour.shows} shows</span>
                      )}
                      {tour.attendance_millions && (
                        <span className="text-muted-foreground">{tour.attendance_millions}M bezoekers</span>
                      )}
                    </div>
                    {tour.notable_venues && tour.notable_venues.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        📍 {tour.notable_venues.slice(0, 2).join(', ')}
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
              <div className="space-y-2">
                {festivals.slice(0, 8).map((festival, index) => {
                  const details = getFestivalDetails(festival);
                  return (
                    <div 
                      key={index}
                      className={details ? "p-2 rounded-lg bg-muted/50" : ""}
                    >
                      {details ? (
                        <>
                          <div className="font-medium text-sm">{details.name}</div>
                          {details.headliners && details.headliners.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Headliners: {details.headliners.slice(0, 3).join(', ')}
                            </div>
                          )}
                          {details.attendance && (
                            <div className="text-xs text-muted-foreground">
                              {details.attendance.toLocaleString()} bezoekers
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="inline-block px-3 py-1.5 text-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                          {getFestivalName(festival)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Venue Records */}
        {venueRecords && venueRecords.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              🏟️ Venue Records
            </h3>
            <ul className="space-y-1">
              {venueRecords.map((record, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span>🎯</span>
                  {record}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
