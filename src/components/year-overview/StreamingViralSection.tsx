import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Music } from 'lucide-react';

interface StreamingViralSectionProps {
  narrative: string;
  viralHits: string[];
  streamingRecords: string[];
}

export const StreamingViralSection: React.FC<StreamingViralSectionProps> = ({ 
  narrative, 
  viralHits,
  streamingRecords 
}) => {
  if (!narrative && viralHits?.length === 0 && streamingRecords?.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          📱 Streaming & Viraal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground">{narrative}</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Viral Hits */}
          {viralHits && viralHits.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🔥 Virale Hits
              </h3>
              <div className="space-y-2">
                {viralHits.slice(0, 5).map((hit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{hit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Streaming Records */}
          {streamingRecords && streamingRecords.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                📊 Streaming Records
              </h3>
              <ul className="space-y-2">
                {streamingRecords.slice(0, 5).map((record, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">🏆</span>
                    {record}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
