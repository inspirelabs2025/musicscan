
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Play,
  Pause,
  Share2,
  Download,
  Trophy,
  Target,
  Telescope,
  Compass,
  BookOpen,
  Award,
  Map,
  Clock,
  Heart,
  Star
} from "lucide-react";
import { DNAVisualization } from './DNA/DNAVisualization';
import { StoryChapter } from './DNA/StoryChapter';
import { MusicalGalaxy } from './DNA/MusicalGalaxy';
import { PersonalityQuiz } from './DNA/PersonalityQuiz';
import { AchievementSystem } from './DNA/AchievementSystem';
import { InteractiveTimeline } from './DNA/InteractiveTimeline';
import { toast } from '@/hooks/use-toast';

export function MusicDNAExplorer() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();
  const { enrichMetadata, isEnriching, enrichmentProgress } = useMetadataEnrichment();
  const [activeChapter, setActiveChapter] = useState(0);
  const [isNarrativeMode, setIsNarrativeMode] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll for parallax effects and progress
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(Math.min(progress, 100));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 mx-auto">
              <DNAVisualization isLoading={true} />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🧬 Music DNA wordt geëxtracteerd...
            </h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Onze AI doorzoekt de diepste lagen van je muzikale ziel
            </p>
            <div className="space-y-2">
              <Progress value={75} className="h-3 w-96 mx-auto" />
              <div className="flex justify-between text-sm text-muted-foreground w-96 mx-auto">
                <span>Analyzing patterns...</span>
                <span>Discovering connections...</span>
                <span>Crafting your story...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 to-orange-500/5 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-destructive/20 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <AlertCircle className="h-24 w-24 mx-auto text-destructive mb-4" />
              <div className="absolute -top-2 -right-2">
                <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">🔬 DNA Lab Needs More Samples</h3>
              <p className="text-lg text-muted-foreground">
                Je collectie mist cruciale metadata voor een complete DNA analyse. 
                Laten we je collectie verrijken met Discogs data!
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-white/50 to-white/30 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Wat we gaan verrijken:
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Badge variant="outline">🎵 Genres & Stijlen</Badge>
                <Badge variant="outline">🏷️ Label Informatie</Badge>
                <Badge variant="outline">🌍 Landen & Regio's</Badge>
                <Badge variant="outline">📅 Release Data</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={enrichMetadata} 
                disabled={isEnriching}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8"
              >
                {isEnriching ? (
                  <>
                    <Telescope className="h-5 w-5 mr-2 animate-spin" />
                    DNA Sequencing... {enrichmentProgress}%
                  </>
                ) : (
                  <>
                    <Telescope className="h-5 w-5 mr-2" />
                    Start DNA Verrijking
                  </>
                )}
              </Button>
              
              {!isEnriching && (
                <Button 
                  onClick={() => refetch()} 
                  disabled={isRefetching}
                  variant="outline"
                  className="bg-white/50 backdrop-blur-sm"
                >
                  {isRefetching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Heranalyseren...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Probeer Opnieuw
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isEnriching && (
              <div className="space-y-3">
                <Progress value={enrichmentProgress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  🧬 DNA strengen worden gelezen... Dit kan even duren maar het resultaat is de moeite waard!
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

  const chapters = [
    {
      id: 'genesis',
      title: 'The Genesis',
      subtitle: 'How your collection was born',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      content: analysis.collectionStory
    },
    {
      id: 'personality',
      title: 'Your Music DNA',
      subtitle: 'The essence of your musical being',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      content: analysis.musicPersonality.musicDNA
    },
    {
      id: 'connections',
      title: 'The Network',
      subtitle: 'Hidden connections in your universe',
      icon: Network,
      color: 'from-pink-500 to-red-600',
      content: analysis.artistConnections.genreEvolution
    },
    {
      id: 'insights',
      title: 'Deep Insights',
      subtitle: 'Patterns you never noticed',
      icon: Lightbulb,
      color: 'from-red-500 to-orange-600',
      content: analysis.collectionInsights.uniqueness
    },
    {
      id: 'future',
      title: 'The Future',
      subtitle: 'Where your journey leads next',
      icon: Compass,
      color: 'from-orange-500 to-yellow-600',
      content: analysis.recommendations.nextPurchases.join(', ')
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-y-auto"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 z-10">
          <div 
            className="h-full bg-white/30 transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <DNAVisualization analysis={analysis} />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Your Music DNA
            </h1>
            
            <p className="text-2xl md:text-3xl text-blue-200 font-light">
              {analysis.musicPersonality.musicDNA}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {analysis.musicPersonality.traits.slice(0, 4).map((trait, index) => (
              <Badge 
                key={index} 
                className="px-4 py-2 text-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all"
              >
                {trait}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setIsNarrativeMode(!isNarrativeMode)}
              size="lg"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
            >
              {isNarrativeMode ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Explore Mode
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Story Mode
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => setShowQuiz(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Take Quiz
            </Button>
          </div>
        </div>
        
        {/* Floating stats */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Albums", value: stats.totalItems, icon: Music },
              { label: "Genres", value: stats.genres?.length || 0, icon: Target },
              { label: "Artists", value: stats.artists?.length || 0, icon: Users },
              { label: "Years Span", value: stats.years?.length > 0 ? `${Math.max(...stats.years) - Math.min(...stats.years)}` : '0', icon: Clock }
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <stat.icon className="h-4 w-4" />
                  {stat.label}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeChapter === index 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <chapter.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{chapter.title}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toast({ title: "Sharing feature coming soon!" })}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share DNA
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toast({ title: "Export feature coming soon!" })}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isNarrativeMode ? (
          // Story Mode
          <div className="space-y-24">
            {chapters.map((chapter, index) => (
              <StoryChapter
                key={chapter.id}
                chapter={chapter}
                analysis={analysis}
                chartData={chartData}
                stats={stats}
                isActive={activeChapter === index}
                onActivate={() => setActiveChapter(index)}
              />
            ))}
          </div>
        ) : (
          // Explore Mode
          <Tabs defaultValue="galaxy" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="galaxy" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Galaxy
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="future" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Future
              </TabsTrigger>
            </TabsList>

            <TabsContent value="galaxy" className="space-y-6">
              <MusicalGalaxy chartData={chartData} analysis={analysis} />
            </TabsContent>

            <TabsContent value="network" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Network className="h-5 w-5" />
                    Artist Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">Interactive network visualization coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <InteractiveTimeline chartData={chartData} analysis={analysis} />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Lightbulb className="h-5 w-5" />
                      Hidden Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-white/80">{analysis.collectionInsights.uniqueness}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">Coherence</h4>
                          <p className="text-white/70 text-sm">{analysis.collectionInsights.coherence}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">Evolution</h4>
                          <p className="text-white/70 text-sm">{analysis.collectionInsights.evolution}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="future" className="space-y-6">
              <div className="grid gap-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border-green-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <ShoppingCart className="h-5 w-5" />
                      Next Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations.nextPurchases.slice(0, 5).map((rec, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-white">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Achievement System */}
      <AchievementSystem 
        stats={stats} 
        analysis={analysis}
        unlockedAchievements={unlockedAchievements}
        onAchievementUnlock={(achievement) => {
          setUnlockedAchievements(prev => [...prev, achievement]);
          toast({
            title: "🏆 Achievement Unlocked!",
            description: achievement,
            duration: 5000
          });
        }}
      />

      {/* Personality Quiz Modal */}
      {showQuiz && (
        <PersonalityQuiz 
          analysis={analysis}
          chartData={chartData}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {/* Fun Facts Footer */}
      <footer className="bg-slate-800/50 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center mb-8 text-white">
            🎭 Fun Facts About Your Collection
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {analysis.funFacts.map((fact, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <p className="text-white/80">{fact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
