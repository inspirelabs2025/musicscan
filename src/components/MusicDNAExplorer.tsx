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
  Trophy,
  Target,
  Telescope,
  Clock,
  Star,
  Share2,
  Download,
  Settings
} from "lucide-react";
import { DNAVisualization } from './DNA/DNAVisualization';
import { StoryChapter } from './DNA/StoryChapter';
import { MusicalGalaxy } from './DNA/MusicalGalaxy';
import { PersonalityQuiz } from './DNA/PersonalityQuiz';
import { InteractiveTimeline } from './DNA/InteractiveTimeline';
import { toast } from '@/hooks/use-toast';

export function MusicDNAExplorer() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();
  const { enrichMetadata, isEnriching, enrichmentProgress } = useMetadataEnrichment();
  const [activeChapter, setActiveChapter] = useState(0);
  const [isNarrativeMode, setIsNarrativeMode] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll for parallax effects and progress
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(Math.min(progress, 100));
        
        // Auto-detect active chapter based on scroll position
        const chapters = document.querySelectorAll('[id^="chapter-"]');
        const viewportCenter = scrollTop + clientHeight / 2;
        
        chapters.forEach((chapter, index) => {
          const element = chapter as HTMLElement;
          const rect = element.getBoundingClientRect();
          const elementTop = scrollTop + rect.top;
          const elementBottom = elementTop + rect.height;
          
          if (viewportCenter >= elementTop && viewportCenter <= elementBottom) {
            setActiveChapter(index);
          }
        });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-lg mx-auto">
          <div className="relative mx-auto w-32 h-32">
            <DNAVisualization isLoading={true} />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              🧬 Music DNA Extraction
            </h2>
            <p className="text-xl text-blue-200/80 leading-relaxed">
              Onze AI doorzoekt de diepste lagen van je muzikale ziel
            </p>
            <div className="space-y-4">
              <Progress value={75} className="h-3 w-full mx-auto bg-white/10" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-200/60">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-8">
              <div className="relative mx-auto w-24 h-24">
                <AlertCircle className="h-24 w-24 text-red-400" />
                <div className="absolute -top-2 -right-2">
                  <Zap className="h-8 w-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">🔬 DNA Lab Needs More Samples</h3>
                <p className="text-lg text-red-200/80 leading-relaxed">
                  Je collectie mist cruciale metadata voor een complete DNA analyse. 
                  Laten we je collectie verrijken met Discogs data!
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-white/10">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Wat we gaan verrijken:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30">🎵 Genres & Stijlen</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-200 border-green-500/30">🏷️ Label Informatie</Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-200 border-purple-500/30">🌍 Landen & Regio's</Badge>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-200 border-orange-500/30">📅 Release Data</Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={enrichMetadata} 
                  disabled={isEnriching}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
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
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
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
                  <Progress value={enrichmentProgress} className="h-3 bg-white/10" />
                  <p className="text-sm text-blue-200/60">
                    🧬 DNA strengen worden gelezen... Dit kan even duren maar het resultaat is de moeite waard!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data?.analysis) return null;

  const { analysis, chartData, stats } = data;

  const chapters = [
    {
      id: 'genesis',
      title: 'De Genesis',
      subtitle: 'Hoe je collectie werd geboren',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      content: analysis.collectionStory
    },
    {
      id: 'personality',
      title: 'Jouw Muziek DNA',
      subtitle: 'De essentie van je muzikale wezen',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      content: analysis.musicPersonality.musicDNA
    },
    {
      id: 'connections',
      title: 'Het Netwerk',
      subtitle: 'Verborgen connecties in je universum',
      icon: Network,
      color: 'from-pink-500 to-red-600',
      content: analysis.artistConnections.genreEvolution
    },
    {
      id: 'insights',
      title: 'Diepe Inzichten',
      subtitle: 'Patronen die je nooit opmerkte',
      icon: Lightbulb,
      color: 'from-red-500 to-orange-600',
      content: analysis.collectionInsights.uniqueness
    },
    {
      id: 'future',
      title: 'De Toekomst',
      subtitle: 'Waar je reis je naartoe leidt',
      icon: TrendingUp,
      color: 'from-orange-500 to-yellow-600',
      content: analysis.recommendations.nextPurchases.join(', ')
    }
  ];

  const scrollToSection = (index: number) => {
    const sectionId = `chapter-${chapters[index].id}`;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    setActiveChapter(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-800 z-40">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div 
        ref={containerRef}
        className="overflow-y-auto h-screen pb-24"
      >
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
          
          <div className="relative z-10 text-center space-y-8 max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-32 h-32">
                  <DNAVisualization analysis={analysis} />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Jouw Muziek DNA
              </h1>
              
              <p className="text-xl md:text-2xl lg:text-3xl text-blue-200/80 font-light max-w-4xl mx-auto leading-relaxed">
                {analysis.musicPersonality.musicDNA}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
              {analysis.musicPersonality.traits.slice(0, 4).map((trait, index) => (
                <Badge 
                  key={index} 
                  className="px-4 py-2 text-base md:text-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all text-white"
                >
                  {trait}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                onClick={() => setIsNarrativeMode(!isNarrativeMode)}
                size="lg"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white transition-all duration-300"
              >
                {isNarrativeMode ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Verken Modus
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Verhaal Modus
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => setShowQuiz(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Doe Quiz
              </Button>

              <Button
                onClick={() => toast({ title: "DNA delen functie komt binnenkort!" })}
                size="lg"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white transition-all duration-300"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Deel DNA
              </Button>
              
              <Button
                onClick={() => toast({ title: "Export functie komt binnenkort!" })}
                size="lg"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white transition-all duration-300"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporteer
              </Button>
            </div>

            {/* Chapter Navigation */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Navigeer Je DNA Verhaal</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {chapters.map((chapter, index) => {
                  const Icon = chapter.icon;
                  const isActive = activeChapter === index;
                  
                  return (
                    <Button
                      key={chapter.id}
                      onClick={() => scrollToSection(index)}
                      variant="ghost"
                      className={`relative flex flex-col items-center gap-2 p-4 h-auto transition-all duration-300 border ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg border-white/30 backdrop-blur-sm' 
                          : 'text-white/60 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {chapter.title}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Stats Section - Part of normal flow */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
              {[
                { label: "Albums", value: stats.totalItems, icon: Music },
                { label: "Genres", value: stats.genres?.length || 0, icon: Target },
                { label: "Artiesten", value: stats.artists?.length || 0, icon: Users },
                { label: "Jaar Bereik", value: stats.years?.length > 0 ? `${Math.max(...stats.years) - Math.min(...stats.years)}` : '0', icon: Clock }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                    <stat.icon className="h-4 w-4" />
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isNarrativeMode ? (
            // Story Mode
            <div className="space-y-24">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} id={`chapter-${chapter.id}`}>
                  <StoryChapter
                    chapter={chapter}
                    analysis={analysis}
                    chartData={chartData}
                    stats={stats}
                    isActive={activeChapter === index}
                    onActivate={() => setActiveChapter(index)}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Explore Mode
            <Tabs defaultValue="galaxy" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/10 backdrop-blur-sm h-auto p-1">
                <TabsTrigger value="galaxy" className="flex items-center gap-2 text-xs md:text-sm py-3 data-[state=active]:bg-white/20">
                  <Globe className="h-4 w-4" />
                  Melkweg
                </TabsTrigger>
                <TabsTrigger value="network" className="flex items-center gap-2 text-xs md:text-sm py-3 data-[state=active]:bg-white/20">
                  <Network className="h-4 w-4" />
                  Netwerk
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2 text-xs md:text-sm py-3 data-[state=active]:bg-white/20">
                  <Clock className="h-4 w-4" />
                  Tijdlijn
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2 text-xs md:text-sm py-3 data-[state=active]:bg-white/20">
                  <Lightbulb className="h-4 w-4" />
                  Inzichten
                </TabsTrigger>
                <TabsTrigger value="future" className="flex items-center gap-2 text-xs md:text-sm py-3 data-[state=active]:bg-white/20">
                  <TrendingUp className="h-4 w-4" />
                  Toekomst
                </TabsTrigger>
              </TabsList>

              <TabsContent value="galaxy" className="space-y-6 mt-8">
                <MusicalGalaxy chartData={chartData} analysis={analysis} />
              </TabsContent>

              <TabsContent value="network" className="space-y-6 mt-8">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Network className="h-5 w-5" />
                      Artiest Netwerk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">Interactieve netwerkvisualisatie komt binnenkort...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6 mt-8">
                <InteractiveTimeline chartData={chartData} analysis={analysis} />
              </TabsContent>

              <TabsContent value="insights" className="space-y-6 mt-8">
                <div className="grid gap-6">
                  <Card className="bg-black/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Lightbulb className="h-5 w-5" />
                        Verborgen Patronen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <p className="text-white text-lg leading-relaxed">{analysis.collectionInsights.uniqueness}</p>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-black/60 rounded-xl p-6 border border-white/10">
                            <h4 className="font-semibold text-white mb-3">Samenhang</h4>
                            <p className="text-white">{analysis.collectionInsights.coherence}</p>
                          </div>
                          <div className="bg-black/60 rounded-xl p-6 border border-white/10">
                            <h4 className="font-semibold text-white mb-3">Evolutie</h4>
                            <p className="text-white">{analysis.collectionInsights.evolution}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="future" className="space-y-6 mt-8">
                <div className="grid gap-6">
                  <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border-green-500/20">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <ShoppingCart className="h-5 w-5" />
                        Volgende Aankopen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.recommendations.nextPurchases.slice(0, 5).map((rec, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
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

        {/* Fun Facts Footer */}
        <footer className="bg-slate-800/50 backdrop-blur-sm border-t border-white/10 py-16 mt-16">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12 text-white">
              🎭 Leuke Weetjes Over Je Collectie
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {analysis.funFacts.map((fact, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-4">
                    <Star className="h-6 w-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-white/80 leading-relaxed">{fact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Configurable Button (replaces Achievement System) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => toast({ title: "Feature configuratie komt binnenkort!" })}
          className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-white transition-all duration-300 rounded-2xl px-4 py-3"
        >
          <Settings className="h-5 w-5 mr-2" />
          Configureer
        </Button>
      </div>

      {/* Personality Quiz Modal */}
      {showQuiz && (
        <PersonalityQuiz 
          analysis={analysis}
          chartData={chartData}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
