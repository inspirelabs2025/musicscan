
import React, { useState } from 'react';
import { useCollectionAIAnalysis } from "@/hooks/useCollectionAIAnalysis";
import { useMetadataEnrichment } from "@/hooks/useMetadataEnrichment";
import { StoryChapter } from "@/components/DNA/StoryChapter";
import { FloatingNavigation } from "@/components/DNA/FloatingNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Brain, Sparkles, Network, Lightbulb, Zap, DollarSign, Rocket, Database, AlertCircle } from "lucide-react";

const STORY_CHAPTERS = [
  {
    id: 'genesis',
    title: 'Genesis',
    subtitle: 'Het begin van jouw muzikale reis',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    content: 'Where it all began...'
  },
  {
    id: 'personality',
    title: 'DNA',
    subtitle: 'Jouw unieke muzikale identiteit',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    content: 'Your musical essence...'
  },
  {
    id: 'connections',
    title: 'Connecties',
    subtitle: 'Het netwerk van jouw muzieksmaak',
    icon: Network,
    color: 'from-green-500 to-teal-500',
    content: 'The web of influences...'
  },
  {
    id: 'insights',
    title: 'Inzichten',
    subtitle: 'Verborgen patronen in jouw collectie',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500',
    content: 'Hidden patterns...'
  },
  {
    id: 'waarde',
    title: 'Waarde',
    subtitle: 'Investment & marktwaarde analyse',
    icon: DollarSign,
    color: 'from-green-600 to-emerald-600',
    content: 'Financial insights...'
  },
  {
    id: 'future',
    title: 'Toekomst',
    subtitle: 'Jouw volgende muzikale ontdekkingen',
    icon: Rocket,
    color: 'from-indigo-500 to-purple-500',
    content: 'What\'s next...'
  }
];

export function MusicDNAExplorer() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();
  const { enrichMetadata, isEnriching, enrichmentProgress } = useMetadataEnrichment();
  const [activeChapter, setActiveChapter] = useState(0);

  // Add debugging for the entire component
  React.useEffect(() => {
    console.log('🔍 DEBUG MusicDNAExplorer:', {
      hasData: !!data,
      isLoading,
      hasError: !!error,
      hasAnalysis: !!data?.analysis,
      hasPriceAnalysis: !!data?.analysis?.priceAnalysis,
      analysisKeys: data?.analysis ? Object.keys(data.analysis) : 'none',
      priceAnalysisData: data?.analysis?.priceAnalysis,
      hasChartData: !!data?.chartData,
      chartDataKeys: data?.chartData ? Object.keys(data.chartData) : 'none'
    });
  }, [data, isLoading, error]);

  // Force refresh function
  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing AI analysis...');
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center py-16">
            <Brain className="h-20 w-20 mx-auto mb-8 text-purple-400 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              AI analyseert je muziek...
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Dit kan even duren terwijl we je collectie doorlichten
            </p>
            <div className="flex justify-center space-x-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-full bg-purple-400/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 space-y-8">
            <AlertCircle className="h-20 w-20 mx-auto text-red-400" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Analyse heeft meer data nodig
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Je collectie mist belangrijke metadata. Laten we dit verrijken!
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={enrichMetadata} 
                disabled={isEnriching}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
              >
                {isEnriching ? (
                  <>
                    <Database className="h-5 w-5 mr-2 animate-spin" />
                    Metadata verrijken... {enrichmentProgress}%
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Verrijk collectie metadata
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleForceRefresh} 
                disabled={isRefetching}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isRefetching ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Opnieuw analyseren...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Probeer opnieuw
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-4xl font-bold text-white mb-4">Geen analyse beschikbaar</h1>
          <Button onClick={handleForceRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center py-16 px-4">
        <div className="flex items-center justify-center mb-6">
          <Zap className="h-12 w-12 md:h-16 md:w-16 text-purple-400 mr-4" />
          <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Muziek DNA
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
          Ontdek de verborgen verhalen, patronen en waarde in jouw unieke muziekcollectie
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={handleForceRefresh} 
            disabled={isRefetching}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isRefetching ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Vernieuwen...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Vernieuw analyse
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Story Chapters */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pb-16">
        {STORY_CHAPTERS.map((chapter, index) => (
          <StoryChapter
            key={chapter.id}
            chapter={chapter}
            analysis={data.analysis}
            chartData={data.chartData}
            stats={data.stats}
            isActive={activeChapter === index}
            onActivate={() => setActiveChapter(index)}
          />
        ))}
      </div>

      {/* Floating Navigation */}
      <FloatingNavigation 
        chapters={STORY_CHAPTERS}
        activeChapter={activeChapter}
        onChapterChange={setActiveChapter}
      />

      {/* Generation info */}
      <div className="relative z-10 text-center text-white/60 pb-8">
        <p className="text-sm">
          Analyse gegenereerd op {new Date(data.generatedAt).toLocaleString('nl-NL')}
        </p>
        <p className="text-xs mt-2">
          🤖 Powered by AI • 🎵 Voor muziekliefhebbers • 💰 Met waardeanalyse
        </p>
      </div>
    </div>
  );
}
