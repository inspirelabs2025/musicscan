
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { InteractiveTimeline } from './InteractiveTimeline';
import { MusicalGalaxy } from './MusicalGalaxy';
import { CollectionHighlights } from './CollectionHighlights';
import { AchievementSystem } from './AchievementSystem';

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

  const renderChapterContent = () => {
    switch (chapter.content) {
      case 'timeline':
        return (
          <div className="space-y-6">
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Jouw Muziekgeschiedenis Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 leading-relaxed mb-6">
                  {analysis.musicHistoryTimeline?.overview || "Je collectie vertelt een verhaal door de tijd..."}
                </p>
                <div className="space-y-4">
                  {analysis.musicHistoryTimeline?.keyPeriods?.slice(0, 3).map((period: string, index: number) => (
                    <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <p className="text-white/80 text-sm">{period}</p>
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
          <div className="space-y-6">
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Artiest Legends & Connecties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Legendes in je collectie</h4>
                    <div className="space-y-3">
                      {analysis.artistStories?.legendaryFigures?.slice(0, 4).map((figure: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{figure}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Verborgen Connecties</h4>
                    <div className="space-y-3">
                      {analysis.artistStories?.hiddenConnections?.slice(0, 4).map((connection: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{connection}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-white text-xl">Artistieke Reizen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.artistStories?.artisticJourneys?.slice(0, 3).map((journey: string, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 leading-relaxed">{journey}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'studios':
        return (
          <div className="space-y-6">
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Studio Legends & Producers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Iconische Studios</h4>
                    <div className="space-y-3">
                      {analysis.studioLegends?.legendaryStudios?.slice(0, 4).map((studio: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{studio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Legendary Producers</h4>
                    <div className="space-y-3">
                      {analysis.studioLegends?.iconicProducers?.slice(0, 4).map((producer: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{producer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-white text-xl">Opname Innovaties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.studioLegends?.recordingInnovations?.slice(0, 3).map((innovation: string, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 leading-relaxed">{innovation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'impact':
        return (
          <div className="space-y-6">
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Culturele Impact & Invloed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Maatschappelijke Invloed</h4>
                    <div className="space-y-3">
                      {analysis.culturalImpact?.societalInfluence?.slice(0, 4).map((influence: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{influence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Generatie Bewegingen</h4>
                    <div className="space-y-3">
                      {analysis.culturalImpact?.generationalMovements?.slice(0, 4).map((movement: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{movement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-white text-xl">Wereldwijde Invloed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.culturalImpact?.globalReach?.slice(0, 3).map((reach: string, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 leading-relaxed">{reach}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'innovations':
        return (
          <div className="space-y-6">
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Muzikale & Technische Innovaties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Technische Doorbraken</h4>
                    <div className="space-y-3">
                      {analysis.musicalInnovations?.technicalBreakthroughs?.slice(0, 4).map((breakthrough: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{breakthrough}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Genre Creaties</h4>
                    <div className="space-y-3">
                      {analysis.musicalInnovations?.genreCreation?.slice(0, 4).map((genre: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{genre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-white text-xl">Productie Methoden</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.musicalInnovations?.productionMethods?.slice(0, 3).map((method: string, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 leading-relaxed">{method}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-6">
            <MusicalGalaxy chartData={chartData} analysis={analysis} />
            
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-white text-xl">Ontdekkingsreis & Verborgen Parels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Ondergewaardeerde Meesterwerken</h4>
                    <div className="space-y-3">
                      {analysis.hiddenGems?.underratedMasterpieces?.slice(0, 4).map((gem: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{gem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Nieuwe Ontdekkingen</h4>
                    <div className="space-y-3">
                      {analysis.discoveryPaths?.nextExplorations?.slice(0, 4).map((exploration: string, index: number) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                          <p className="text-white/80 text-sm">{exploration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-white text-xl">Volgende Stappen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.discoveryPaths?.genreExpansions?.slice(0, 3).map((expansion: string, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 leading-relaxed">{expansion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <CollectionHighlights stats={stats} profile={{ summary: "Je collectie profiel...", keyHighlights: [] }} />;
    }
  };

  return (
    <div className="mb-16">
      {/* Chapter Header */}
      <Card 
        variant="dark"
        className={`cursor-pointer transition-all duration-500 transform hover:scale-[1.02] mb-8 ${
          isActive ? 'ring-2 ring-white/30' : ''
        }`}
        onClick={onActivate}
      >
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${chapter.color} shadow-2xl`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{chapter.title}</h2>
                <p className="text-white/80 text-lg">{chapter.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-white/10 text-white border-white/20">
                Hoofdstuk {chapter.id}
              </Badge>
              {isActive ? (
                <ChevronDown className="h-6 w-6 text-white" />
              ) : (
                <ChevronRight className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Content */}
      {isActive && (
        <div className="space-y-8 pl-4 border-l-4 border-gradient-to-b from-purple-500 to-blue-500 ml-8">
          {renderChapterContent()}
        </div>
      )}
    </div>
  );
}
