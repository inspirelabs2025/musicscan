
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { InteractiveTimeline } from './InteractiveTimeline';
import { MusicalGalaxy } from './MusicalGalaxy';
import { CollectionHighlights } from './CollectionHighlights';
import { AchievementSystem } from './AchievementSystem';
import { useLanguage } from "@/contexts/LanguageContext";

interface StoryChapterProps {
  chapter: {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    content: string;
  };
  analysis: any;
  chartData: any;
  stats: any;
  isActive: boolean;
  onActivate: () => void;
}

export function StoryChapter({ chapter, analysis, chartData, stats, isActive, onActivate }: StoryChapterProps) {
  const Icon = chapter.icon;
  const { tr } = useLanguage();
  const a = tr.aiAnalysis;

  const renderChapterContent = () => {
    switch (chapter.content) {
      case 'timeline':
        return (
          <div className="space-y-4 md:space-y-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.timelineTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 text-sm md:text-base leading-relaxed mb-4 md:mb-6">
                  {analysis.musicHistoryTimeline?.overview || a.timelineFallback}
                </p>
                <div className="space-y-3 md:space-y-4">
                  {analysis.musicHistoryTimeline?.keyPeriods?.slice(0, 3).map((period: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted rounded-lg border border-border">
                      <p className="text-foreground/80 text-xs md:text-sm">{period}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {chartData.decadeDistribution && (
              <InteractiveTimeline chartData={chartData} analysis={analysis} />
            )}
          </div>
        );

      case 'artists':
        return (
          <div className="space-y-4 md:space-y-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.artistLegendsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.legendsInCollection}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.artistStories?.legendaryFigures?.slice(0, 4).map((figure: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{figure}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.hiddenConnections}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.artistStories?.hiddenConnections?.slice(0, 4).map((connection: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{connection}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.artisticJourneys}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {analysis.artistStories?.artisticJourneys?.slice(0, 3).map((journey: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{journey}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'studios':
        return (
          <div className="space-y-4 md:space-y-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.studioLegendsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.iconicStudios}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.studioLegends?.legendaryStudios?.slice(0, 4).map((studio: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{studio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.legendaryProducers}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.studioLegends?.iconicProducers?.slice(0, 4).map((producer: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{producer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.recordingInnovations}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {analysis.studioLegends?.recordingInnovations?.slice(0, 3).map((innovation: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{innovation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'impact':
        return (
          <div className="space-y-4 md:space-y-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.culturalImpactTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.societalInfluence}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.culturalImpact?.societalInfluence?.slice(0, 4).map((influence: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{influence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.generationalMovements}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.culturalImpact?.generationalMovements?.slice(0, 4).map((movement: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{movement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.globalReach}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {analysis.culturalImpact?.globalReach?.slice(0, 3).map((reach: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{reach}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'innovations':
        return (
          <div className="space-y-4 md:space-y-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.innovationsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.technicalBreakthroughs}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.musicalInnovations?.technicalBreakthroughs?.slice(0, 4).map((breakthrough: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{breakthrough}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.genreCreations}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.musicalInnovations?.genreCreation?.slice(0, 4).map((genre: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{genre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.productionMethods}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {analysis.musicalInnovations?.productionMethods?.slice(0, 3).map((method: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{method}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-4 md:space-y-6">
            <MusicalGalaxy chartData={chartData} analysis={analysis} />
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.discoveryTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.underratedMasterpieces}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.hiddenGems?.underratedMasterpieces?.slice(0, 4).map((gem: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{gem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">{a.newDiscoveries}</h4>
                    <div className="space-y-2 md:space-y-3">
                      {analysis.discoveryPaths?.nextExplorations?.slice(0, 4).map((exploration: string, index: number) => (
                        <div key={index} className="p-2 md:p-3 bg-muted rounded-lg border border-border">
                          <p className="text-foreground/80 text-xs md:text-sm">{exploration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-foreground text-lg md:text-xl">{a.nextSteps}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {analysis.discoveryPaths?.genreExpansions?.slice(0, 3).map((expansion: string, index: number) => (
                    <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{expansion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <CollectionHighlights stats={stats} profile={{ summary: a.collectionProfile, keyHighlights: [] }} />;
    }
  };

  return (
    <div className="mb-12 md:mb-16" id={`chapter-${chapter.id}`}>
      <Card 
        variant="dark"
        className={`cursor-pointer transition-all duration-500 transform hover:scale-[1.02] mb-6 md:mb-8 ${
          isActive ? 'ring-2 ring-white/30' : ''
        }`}
        onClick={onActivate}
      >
        <CardContent className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6 flex-1 min-w-0">
              <div className={`p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${chapter.color} shadow-2xl flex-shrink-0`}>
                <Icon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 md:mb-2 truncate">{chapter.title}</h2>
                <p className="text-white/80 text-sm md:text-base lg:text-lg line-clamp-2 md:line-clamp-1">{chapter.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <Badge className="bg-white/10 text-white border-white/20 text-xs md:text-sm">
                <span className="hidden sm:inline">{a.chapter} </span>{chapter.id}
              </Badge>
              {isActive ? (
                <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isActive && (
        <div className="space-y-6 md:space-y-8 pl-2 md:pl-4 border-l-2 md:border-l-4 border-primary ml-4 md:ml-8">
          {renderChapterContent()}
        </div>
      )}
    </div>
  );
}
