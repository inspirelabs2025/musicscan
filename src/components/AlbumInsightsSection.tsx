import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Lightbulb, Clock, Music, Sparkles, TrendingUp } from "lucide-react";
import { AlbumInsights } from "@/hooks/useAlbumInsights";

interface AlbumInsightsSectionProps {
  insights: AlbumInsights;
}

export function AlbumInsightsSection({ insights }: AlbumInsightsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">AI Insights</h2>
        <Badge variant="secondary" className="ml-auto">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Gegenereerd
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Historical Context */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Historische Context</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.historical_context}
          </p>
        </Card>

        {/* Artistic Significance */}
        <Card className="p-6 bg-gradient-to-br from-accent/5 to-background">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-accent-foreground" />
            <h3 className="font-semibold">Artistieke Betekenis</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.artistic_significance}
          </p>
        </Card>

        {/* Cultural Impact */}
        <Card className="p-6 bg-gradient-to-br from-secondary/5 to-background">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-secondary-foreground" />
            <h3 className="font-semibold">Culturele Impact</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.cultural_impact}
          </p>
        </Card>

        {/* Production Story */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold">Productie & Opname</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.production_story}
          </p>
        </Card>

        {/* Musical Innovations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold">Muzikale Innovaties</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.musical_innovations}
          </p>
        </Card>

        {/* Collector Value */}
        <Card className="p-6 bg-gradient-to-br from-green-50/50 to-background dark:from-green-900/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold">Collecteurswaarde</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insights.collector_value}
          </p>
        </Card>

        <Separator />

        {/* Fun Facts */}
        {insights.fun_facts && insights.fun_facts.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Interessante Feiten
            </h3>
            <ul className="space-y-2">
              {insights.fun_facts.map((fact, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {fact}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Recommended Listening */}
        {insights.recommended_listening && insights.recommended_listening.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-blue-500" />
              Aanbevolen Tracks
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.recommended_listening.map((track, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {track}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Similar Albums */}
        {insights.similar_albums && insights.similar_albums.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-500" />
              Vergelijkbare Albums
            </h3>
            <div className="space-y-3">
              {insights.similar_albums.map((album, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-4">
                  <div className="font-medium text-sm">
                    {album.artist} - {album.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {album.reason}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}