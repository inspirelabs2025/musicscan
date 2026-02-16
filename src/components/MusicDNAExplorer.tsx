
import React, { useState } from 'react';
import { useCollectionAIAnalysis } from "@/hooks/useCollectionAIAnalysis";
import { useMetadataEnrichment } from "@/hooks/useMetadataEnrichment";
import { StoryChapter } from "@/components/DNA/StoryChapter";
import { MusicHistoryHeader } from "@/components/DNA/MusicHistoryHeader";
import { FloatingNavigation } from "@/components/DNA/FloatingNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Clock, Users, Building2, Sparkles, Lightbulb, Compass, Database, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function MusicDNAExplorer() {
  const { data, isLoading, error, refetch, isRefetching } = useCollectionAIAnalysis();
  const { enrichMetadata, isEnriching, enrichmentProgress } = useMetadataEnrichment();
  const [activeChapter, setActiveChapter] = useState(0);
  const { tr } = useLanguage();
  const a = tr.aiAnalysis;

  const MUSIC_CHAPTERS = [
    { id: 'timeline', title: a.chapterTimeline, subtitle: a.chapterTimelineSub, icon: Clock, color: 'from-blue-500 to-cyan-500', content: 'timeline' },
    { id: 'artists', title: a.chapterArtists, subtitle: a.chapterArtistsSub, icon: Users, color: 'from-purple-500 to-pink-500', content: 'artists' },
    { id: 'studios', title: a.chapterStudios, subtitle: a.chapterStudiosSub, icon: Building2, color: 'from-green-500 to-teal-500', content: 'studios' },
    { id: 'impact', title: a.chapterImpact, subtitle: a.chapterImpactSub, icon: Sparkles, color: 'from-orange-500 to-red-500', content: 'impact' },
    { id: 'innovations', title: a.chapterInnovations, subtitle: a.chapterInnovationsSub, icon: Lightbulb, color: 'from-yellow-500 to-orange-500', content: 'innovations' },
    { id: 'discovery', title: a.chapterDiscovery, subtitle: a.chapterDiscoverySub, icon: Compass, color: 'from-indigo-500 to-purple-500', content: 'discovery' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 md:p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center py-8 md:py-16 px-4">
            <Clock className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 mx-auto mb-4 md:mb-8 text-primary animate-pulse" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-bold text-foreground mb-2 md:mb-4">
              {a.analyzing}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-4 md:mb-8">
              {a.analyzingSubtitle}
            </p>
            <div className="flex justify-center space-x-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-primary/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 md:p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 md:py-16 space-y-4 md:space-y-8 px-4">
            <AlertCircle className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 mx-auto text-destructive" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-bold text-foreground mb-2 md:mb-4">
              {a.dataMissing}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-4 md:mb-8">
              {a.dataMissingSubtitle}
            </p>
            
            <div className="space-y-4 flex flex-col items-center">
              <Button 
                onClick={enrichMetadata} 
                disabled={isEnriching}
                size="lg"
                className="bg-gradient-vinyl hover:opacity-90 text-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg w-full max-w-sm"
              >
                {isEnriching ? (
                  <>
                    <Database className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin" />
                    {a.enriching} {enrichmentProgress}%
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    {a.enrichMetadata}
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => refetch()} 
                disabled={isRefetching}
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-accent w-full max-w-sm"
              >
                {isRefetching ? (
                  <>
                    <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-2 animate-spin" />
                    {a.retrying}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    {a.retry}
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 md:p-4 lg:p-8">
        <div className="max-w-4xl mx-auto text-center py-8 md:py-16 px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">{a.noAnalysis}</h1>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            {a.retryButton}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-96 md:h-96 bg-vinyl-gold/10 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>

      {/* Header with Music History Overview */}
      <div className="relative z-10 text-center py-8 md:py-16 px-2 md:px-4">
        <div className="max-w-6xl mx-auto">
          <MusicHistoryHeader 
            stats={data.stats}
            timeline={data.analysis.musicHistoryTimeline}
            chartData={data.chartData}
          />
        </div>
      </div>

      {/* Music History Chapters */}
      <div className="relative z-10 max-w-6xl mx-auto px-2 md:px-4 lg:px-8 pb-16 md:pb-24">
        {MUSIC_CHAPTERS.map((chapter, index) => (
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
        chapters={MUSIC_CHAPTERS}
        activeChapter={activeChapter}
        onChapterChange={setActiveChapter}
      />

      {/* Generation info */}
      <div className="relative z-10 text-center text-muted-foreground pb-8 px-4">
        <p className="text-xs md:text-sm">
          {a.generatedAt} {new Date(data.generatedAt).toLocaleString('nl-NL')}
        </p>
        <Button 
          onClick={() => refetch()} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground mt-2 text-xs md:text-sm"
        >
          <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
          {a.refreshAnalysis}
        </Button>
      </div>
    </div>
  );
}
