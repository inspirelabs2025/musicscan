
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disc, Album, Music, Star, Sparkles } from 'lucide-react';

interface CollectionHighlightsProps {
  stats: {
    totalItems: number;
    uniqueArtists: number;
    uniqueLabels: number;
    totalValue: number;
    avgValue: number;
  };
  profile: {
    summary: string;
    keyHighlights: string[];
  };
}

export function CollectionHighlights({ stats, profile }: CollectionHighlightsProps) {
  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Album className="h-5 w-5 text-blue-400" />
              {stats.totalItems}
            </CardTitle>
            <p className="text-sm text-white/60">Releases</p>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              {stats.uniqueArtists}
            </CardTitle>
            <p className="text-sm text-white/60">Artiesten</p>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Disc className="h-5 w-5 text-pink-400" />
              {stats.uniqueLabels}
            </CardTitle>
            <p className="text-sm text-white/60">Labels</p>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              €{stats.totalValue.toFixed(0)}
            </CardTitle>
            <p className="text-sm text-white/60">Waarde</p>
          </CardHeader>
        </Card>
      </div>

      {/* Collection Summary */}
      <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Collectie Profiel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-white leading-relaxed">
            {profile.summary}
          </p>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white/80 mb-2">Hoogtepunten</h4>
            <div className="flex flex-wrap gap-2">
              {profile.keyHighlights.map((highlight, index) => (
                <Badge 
                  key={index}
                  className="bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

