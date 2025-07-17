import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCollectionAIAnalysis } from "@/hooks/useCollectionAIAnalysis";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Lightbulb,
  ShoppingCart,
  Music,
  Network,
  Zap,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export function AIAnalysisTab() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">AI analyseert je collectie...</h3>
          <p className="text-muted-foreground">Dit kan even duren terwijl onze AI je muziekcollectie onderzoekt</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">AI Analyse Mislukt</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Opnieuw proberen...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Opnieuw proberen
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.analysis) return null;

  const { analysis } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg">
        <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">🤖 AI Collectie Analyse</h2>
        <p className="text-muted-foreground">AI-gestuurde inzichten in je unieke muziekcollectie</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyseren...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Heranalyseren
            </>
          )}
        </Button>
      </div>

      {/* Music Personality */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Jouw Muziekpersoonlijkheid
          </CardTitle>
          <CardDescription>AI-analyse van je muzieksmaak en persoonlijkheid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg">
            <h4 className="font-semibold mb-2">Muziek DNA</h4>
            <p className="text-lg font-medium text-primary">{analysis.musicPersonality.musicDNA}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Persoonlijkheidsprofiel</h4>
            <p className="text-muted-foreground">{analysis.musicPersonality.profile}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Karaktereigenschappen</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.musicPersonality.traits.map((trait, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Insights & Artist Connections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Collectie Inzichten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Uniekheid</h4>
              <p className="text-sm">{analysis.collectionInsights.uniqueness}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Samenhang</h4>
              <p className="text-sm">{analysis.collectionInsights.coherence}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Curatie</h4>
              <p className="text-sm">{analysis.collectionInsights.curation}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Evolutie</h4>
              <p className="text-sm">{analysis.collectionInsights.evolution}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              Artiest Connecties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.artistConnections.collaborations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Collaboraties</h4>
                <div className="space-y-1">
                  {analysis.artistConnections.collaborations.slice(0, 3).map((collab, index) => (
                    <p key={index} className="text-sm">{collab}</p>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.artistConnections.labelConnections.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Label Connecties</h4>
                <div className="space-y-1">
                  {analysis.artistConnections.labelConnections.slice(0, 3).map((label, index) => (
                    <p key={index} className="text-sm">{label}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Genre Evolutie</h4>
              <p className="text-sm">{analysis.artistConnections.genreEvolution}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Insights */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Investment Inzichten
          </CardTitle>
          <CardDescription>Potentiële waarde en groeimogelijkheden</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">💎 Verborgen Juweeltjes</h4>
            <div className="space-y-2">
              {analysis.investmentInsights.hiddenGems.map((gem, index) => (
                <div key={index} className="p-2 bg-green-500/5 rounded border-l-2 border-green-500/20">
                  <p className="text-sm">{gem}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">⭐ Premium Items</h4>
            <div className="space-y-2">
              {analysis.investmentInsights.premiumItems.map((item, index) => (
                <div key={index} className="p-2 bg-yellow-500/5 rounded border-l-2 border-yellow-500/20">
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Market Trends</h4>
            <p className="text-sm text-muted-foreground">{analysis.investmentInsights.trends}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Culturele Context
          </CardTitle>
          <CardDescription>Historische en geografische inzichten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Tijdlijn Verhaal</h4>
            <p className="text-muted-foreground">{analysis.culturalContext.timeline}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Belangrijke Decennia</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.culturalContext.decades.map((decade, index) => (
                  <Badge key={index} variant="outline">{decade}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Muziekbewegingen</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.culturalContext.movements.map((movement, index) => (
                  <Badge key={index} variant="outline">{movement}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Geografische Spreiding</h4>
            <p className="text-sm text-muted-foreground">{analysis.culturalContext.geography}</p>
          </div>
        </CardContent>
      </Card>

      {/* Fun Facts */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-500" />
            🎵 Fun Facts
          </CardTitle>
          <CardDescription>Verrassende ontdekkingen over je collectie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.funFacts.map((fact, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg border border-purple-500/10">
                <p className="text-sm font-medium">{fact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            AI Aanbevelingen
          </CardTitle>
          <CardDescription>Persoonlijke suggesties voor je collectie</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Music className="h-4 w-4" />
              Volgende Aankopen
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.nextPurchases.map((purchase, index) => (
                <div key={index} className="p-3 bg-orange-500/5 rounded border-l-2 border-orange-500/20">
                  <p className="text-sm">{purchase}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nieuwe Artiesten
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.artistDiscovery.map((artist, index) => (
                <div key={index} className="p-3 bg-blue-500/5 rounded border-l-2 border-blue-500/20">
                  <p className="text-sm">{artist}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-3">Genre Verkenning</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendations.genreExploration.map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Story */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Jouw Collectie Verhaal
          </CardTitle>
          <CardDescription>AI's interpretatie van je muzikale reis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-muted-foreground italic">
            "{analysis.collectionStory}"
          </p>
        </CardContent>
      </Card>

      {/* Generation Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Analyse gegenereerd op {new Date(data.generatedAt).toLocaleString('nl-NL')}</p>
      </div>
    </div>
  );
}