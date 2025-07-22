
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCollectionAIAnalysis } from "@/hooks/useCollectionAIAnalysis";
import { useMetadataEnrichment } from "@/hooks/useMetadataEnrichment";
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
  Activity,
  ChevronDown,
  ChevronRight,
  Download,
  Share2,
  Database,
  Target,
  Trophy,
  Gamepad2,
  DollarSign,
  TrendingDown
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
  LineChart,
  Line,
  Treemap,
  Sankey
} from "recharts";

export function EnhancedAIAnalysisTab() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();
  const { enrichMetadata, isEnriching, enrichmentProgress } = useMetadataEnrichment();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<string[]>(['personality']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 rounded-xl">
          <div className="relative">
            <Brain className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full"></div>
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI analyseert je collectie...
          </h3>
          <p className="text-muted-foreground mb-6">Dit kan even duren terwijl onze AI je muziekcollectie onderzoekt</p>
          <div className="max-w-md mx-auto space-y-3">
            <Progress value={75} className="h-2" />
            <p className="text-sm text-muted-foreground">Patronen herkennen en inzichten genereren...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-3">AI Analyse Heeft Meer Data Nodig</h3>
            <p className="text-muted-foreground mb-6">
              Je collectie mist belangrijke metadata (genres, labels, landen). 
              Laten we dit verrijken met Discogs data voor betere analyses!
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={enrichMetadata} 
                disabled={isEnriching}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {isEnriching ? (
                  <>
                    <Database className="h-4 w-4 mr-2 animate-spin" />
                    Metadata Verrijken... {enrichmentProgress}%
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Verrijk Collectie Metadata
                  </>
                )}
              </Button>
              
              {!isEnriching && (
                <Button 
                  onClick={() => refetch()} 
                  disabled={isRefetching}
                  variant="outline"
                >
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
              )}
            </div>
            
            {isEnriching && (
              <div className="mt-6">
                <Progress value={enrichmentProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Metadata wordt verrijkt met Discogs informatie...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.analysis) return null;

  const { analysis, chartData, stats } = data;

  // Enhanced chart colors with gradients
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
    <div className="space-y-8">
      {/* Enhanced Header with Actions */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-xl"></div>
        <div className="relative p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🤖 AI Collectie Analyse
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            AI-gestuurde inzichten in je unieke muziekcollectie
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-white/50 backdrop-blur-sm hover:bg-white/70"
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
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={enrichMetadata}
              disabled={isEnriching}
              className="bg-white/50 backdrop-blur-sm hover:bg-white/70"
            >
              {isEnriching ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-spin" />
                  Verrijken...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Data Verrijken
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/70">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/70">
              <Share2 className="h-4 w-4 mr-2" />
              Delen
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Totaal Albums", value: stats.totalItems, icon: Music, color: "text-primary" },
          { label: "Genres", value: stats.genres, icon: Target, color: "text-vinyl-gold" },
          { label: "Artiesten", value: stats.artists, icon: Users, color: "text-blue-500" },
          { label: "Geschatte Waarde", value: stats.priceStats ? `€${Math.round(stats.priceStats.total)}` : '€0', icon: DollarSign, color: "text-green-500" }
        ].map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6 text-center">
              <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
              <div className="text-3xl font-bold mb-1 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Overzicht</span>
          </TabsTrigger>
          <TabsTrigger value="value" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Waarde</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grafieken</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Inzichten</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Aanbevelingen</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Prestaties</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Music Personality - Enhanced */}
          <Collapsible 
            open={expandedSections.includes('personality')} 
            onOpenChange={() => toggleSection('personality')}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Jouw Muziekpersoonlijkheid
                    </div>
                    {expandedSections.includes('personality') ? 
                      <ChevronDown className="h-5 w-5" /> : 
                      <ChevronRight className="h-5 w-5" />
                    }
                  </CardTitle>
                  <CardDescription>AI-analyse van je muzieksmaak en persoonlijkheid</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Muziek DNA
                    </h4>
                    <p className="text-xl font-medium text-primary leading-relaxed">
                      {analysis.musicPersonality.musicDNA}
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Persoonlijkheidsprofiel</h4>
                      <p className="text-muted-foreground leading-relaxed">{analysis.musicPersonality.profile}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Karaktereigenschappen</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.musicPersonality.traits.map((trait, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-sm px-3 py-1 bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 transition-all cursor-pointer"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Collection Story - Enhanced */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Jouw Collectie Verhaal
              </CardTitle>
              <CardDescription>AI's interpretatie van je muzikale reis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative p-6 bg-gradient-to-r from-white/50 to-white/30 rounded-lg border border-primary/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-600 rounded-full"></div>
                <blockquote className="text-lg leading-relaxed text-muted-foreground italic pl-4">
                  "{analysis.collectionStory.origin}"
                </blockquote>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value" className="space-y-6">
          {/* Price Analysis Section */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Waarde & Investment Analyse
              </CardTitle>
              <CardDescription>Marktwaarde, investment potentieel en collectie strategie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Marktwaarde Overzicht</h4>
                  <p className="text-muted-foreground leading-relaxed">{analysis.priceAnalysis.marketTales}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Investment Potentieel</h4>
                  <p className="text-muted-foreground leading-relaxed">{analysis.priceAnalysis.investmentStory}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Collectie Strategie</h4>
                  <p className="text-muted-foreground leading-relaxed">{analysis.priceAnalysis.collectorWisdom}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Risico Beoordeling</h4>
                  <p className="text-muted-foreground leading-relaxed">{analysis.priceAnalysis.valueSecrets}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Portfolio Breakdown</h4>
                <p className="text-muted-foreground leading-relaxed">{analysis.priceAnalysis.portfolioStory}</p>
              </div>
            </CardContent>
          </Card>

          {/* Value Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Price by Decade */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Waarde per Decennium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.priceByDecade || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="decade" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, 'Gem. Waarde']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="avgPrice" 
                      fill="hsl(142 81% 45%)" 
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Value by Genre */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Waarde per Genre (Top 6)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(chartData.valueByGenre || []).slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="genre" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${value}`, 'Gem. Waarde']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="avgPrice" 
                      fill="hsl(280 81% 56%)" 
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Distribution with enhanced styling */}
            <Card className="group hover:shadow-lg transition-all duration-300">
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
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Genre Distribution with enhanced interactivity */}
            <Card className="group hover:shadow-lg transition-all duration-300">
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
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--vinyl-purple))" 
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card className="bg-purple-900/10 backdrop-blur-sm border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-500" />
                  Verborgen Patronen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed">{analysis.collectionInsights.uniqueMagic}</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-500/10">
                      <h4 className="font-semibold mb-3">Samenhang</h4>
                      <p className="text-muted-foreground">{analysis.collectionInsights.redThread}</p>
                    </div>
                    <div className="bg-purple-500/5 rounded-xl p-6 border border-purple-500/10">
                      <h4 className="font-semibold mb-3">Evolutie</h4>
                      <p className="text-muted-foreground">{analysis.collectionInsights.musicalJourney}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Volgende Aankopen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.nextAdventures.slice(0, 5).map((rec, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-green-500/10 hover:bg-white/10 transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Collection Achievements */}
            {[
              { title: "Eerste Collectie", description: "Je eerste 10 albums", achieved: stats.totalItems >= 10, icon: Music },
              { title: "Genre Explorer", description: "5+ verschillende genres", achieved: stats.genres >= 5, icon: Globe },
              { title: "Vintage Verzamelaar", description: "Album van voor 1980", achieved: true, icon: Trophy },
              { title: "Label Loyalist", description: "10+ releases van zelfde label", achieved: false, icon: Target },
              { title: "Waarde Opbouwer", description: "Collectie van €500+", achieved: stats.priceStats ? stats.priceStats.total >= 500 : false, icon: DollarSign },
              { title: "Investment Expert", description: "Hidden gems gevonden", achieved: false, icon: TrendingUp },
            ].map((achievement, index) => (
              <Card key={index} className={`${achievement.achieved ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/20'} transition-all hover:scale-105`}>
                <CardContent className="p-6 text-center">
                  <achievement.icon className={`h-12 w-12 mx-auto mb-4 ${achievement.achieved ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                  <Badge variant={achievement.achieved ? "default" : "secondary"}>
                    {achievement.achieved ? "Behaald! 🏆" : "Niet behaald"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Gamepad2 className="h-6 w-6" />
                Collectie Quiz
              </CardTitle>
              <CardDescription>Test je kennis over je eigen collectie!</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-white/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Raad je volgende aankoop!</h3>
                <p className="text-muted-foreground mb-4">
                  Gebaseerd op je huidige collectie, welk genre zou je als volgende moeten verkennen?
                </p>
                <div className="space-y-3">
                  {['Jazz Fusion', 'Post-Punk', 'Krautrock', 'Neo-Soul'].map((option, index) => (
                    <Button key={index} variant="outline" className="w-full hover:bg-primary/10">
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generation Info */}
      <div className="text-center text-sm text-muted-foreground border-t pt-6">
        <p>Analyse gegenereerd op {new Date(data.generatedAt).toLocaleString('nl-NL')}</p>
        <p className="mt-1">🤖 Powered by AI • 🎵 Voor muziekliefhebbers • 💰 Met waardeanalyse</p>
      </div>
    </div>
  );
}
