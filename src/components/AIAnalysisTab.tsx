import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  LineChart,
  ScatterChart,
  Scatter
} from "recharts";

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

  const { analysis, chartData, stats } = data;

  // Chart colors using design system
  const chartColors = [
    'hsl(var(--vinyl-purple))',
    'hsl(var(--vinyl-gold))', 
    'hsl(213 81% 56%)',
    'hsl(142 81% 45%)',
    'hsl(12 81% 56%)',
    'hsl(280 81% 56%)',
    'hsl(45 100% 51%)',
    'hsl(190 81% 45%)'
  ];

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

      {/* Collection Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
            <div className="text-sm text-muted-foreground">Totaal Albums</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-vinyl-gold">{stats.genres.length}</div>
            <div className="text-sm text-muted-foreground">Genres</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.artists.length}</div>
            <div className="text-sm text-muted-foreground">Artiesten</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {stats.years.length > 0 ? `${stats.years[stats.years.length - 1] - stats.years[0]}` : '0'}
            </div>
            <div className="text-sm text-muted-foreground">Jaar Spreiding</div>
          </CardContent>
        </Card>
      </div>

      {/* Format & Genre Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-vinyl-purple" />
              Format Verdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <RechartsPieChart data={chartData.formatDistribution}>
                  {chartData.formatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RechartsPieChart>
                <Tooltip 
                  formatter={(value, name) => [`${value} albums`, name]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Top Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.genreDistribution.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  formatter={(value) => [`${value} albums`, 'Aantal']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--vinyl-purple))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Music Personality */}
      <Card className="border-primary/20 mb-6">
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

      {/* Artist & Year Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Artiesten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topArtists} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value) => [`${value} albums`, 'Aantal']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="albums" fill="hsl(var(--vinyl-gold))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Muziek per Decennium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.yearDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="decade" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  formatter={(value) => [`${value} albums`, 'Aantal']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--vinyl-purple))" 
                  fill="hsl(var(--vinyl-purple) / 0.3)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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

      {/* Investment Insights with Value Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-green-500/20">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Waarde Verdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.valueDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  formatter={(value) => [`${value} albums`, 'Aantal']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(142 81% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cultural Context with Geography Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Landen Verdeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.countryDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="country" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [`${value} albums`, 'Aantal']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(213 81% 56%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Label Distribution Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-500" />
            Top Platenlabels
          </CardTitle>
          <CardDescription>De meest vertegenwoordigde labels in je collectie</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.labelDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                formatter={(value) => [`${value} releases`, 'Aantal']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="releases" fill="hsl(280 81% 56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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