
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Building2, Sparkles, Lightbulb, Compass, Star, Award } from "lucide-react";

interface StoryChapterProps {
  chapter: {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<any>;
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
  const renderChapterContent = () => {
    switch (chapter.id) {
      case 'timeline':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🕰️ Muzikale Evolutie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white leading-relaxed mb-6">{analysis.musicHistoryTimeline.musicalEvolution}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Belangrijke Tijdperken</h4>
                    <div className="space-y-3">
                      {analysis.musicHistoryTimeline.keyPeriods.map((period, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-white text-sm leading-relaxed">{period}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Culturele Bewegingen</h4>
                    <div className="space-y-3">
                      {analysis.musicHistoryTimeline.culturalMovements.map((movement, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                          <Sparkles className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white text-sm leading-relaxed">{movement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decade Distribution Visualization */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Tijdlijn Distributie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.decadeDistribution.map((decade, index) => (
                    <div key={decade.decade} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{decade.decade}</span>
                        <Badge className="bg-blue-500/20 text-blue-200">
                          {decade.count} albums ({decade.percentage}%)
                        </Badge>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${decade.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/60">
                        {decade.artists} artiesten, {decade.genres} genres
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'artists':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🎭 Legendarische Figuren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {analysis.artistStories.legendaryFigures.map((story, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <Star className="h-5 w-5 text-purple-400" />
                        <Badge className="bg-purple-500/20 text-purple-200">Legend #{index + 1}</Badge>
                      </div>
                      <p className="text-white leading-relaxed">{story}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Verborgen Connecties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.artistStories.hiddenConnections.map((connection, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white text-sm leading-relaxed">{connection}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Artistieke Reizen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.artistStories.artisticJourneys.map((journey, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white text-sm leading-relaxed">{journey}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border-pink-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">Samenwerkingsverhalen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.artistStories.collaborationTales.map((tale, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-white leading-relaxed">{tale}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'studios':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-sm border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🏛️ Legendarische Studio's
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.studioLegends.legendaryStudios.map((studio, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <Building2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-white leading-relaxed">{studio}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Iconische Producers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.studioLegends.iconicProducers.map((producer, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm leading-relaxed">{producer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Label Geschiedenis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.studioLegends.labelHistories.map((history, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm leading-relaxed">{history}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'impact':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🌍 Maatschappelijke Invloed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.culturalImpact.societalInfluence.map((influence, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-white leading-relaxed">{influence}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Generatie Bewegingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.culturalImpact.generationalMovements.map((movement, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{movement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Mode & Lifestyle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.culturalImpact.fashionAndStyle.map((style, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{style}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'innovations':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  💡 Technische Doorbraken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.musicalInnovations.technicalBreakthroughs.map((breakthrough, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        <Badge className="bg-yellow-500/20 text-yellow-200">Innovatie</Badge>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{breakthrough}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Genre Creatie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.musicalInnovations.genreCreation.map((genre, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{genre}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Vocale Technieken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.musicalInnovations.vocalTechniques.map((technique, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{technique}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border-indigo-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  💎 Ondergewaardeerde Meesterwerken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.hiddenGems.underratedMasterpieces.map((gem, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-white leading-relaxed">{gem}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Zeldzame Vondsten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.hiddenGems.rareFfinds.map((find, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-indigo-400" />
                          <Badge className="bg-indigo-500/20 text-indigo-200">Zeldzaam</Badge>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{find}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Volgende Ontdekkingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.discoveryPaths.nextExplorations.map((exploration, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Compass className="h-4 w-4 text-purple-400" />
                          <Badge className="bg-purple-500/20 text-purple-200">Ontdek</Badge>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{exploration}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div className="text-white">Hoofdstuk inhoud wordt geladen...</div>;
    }
  };

  return (
    <div 
      className={`transition-all duration-700 cursor-pointer ${
        isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95 hover:opacity-90 hover:scale-98'
      }`}
      onClick={onActivate}
    >
      <div className={`bg-gradient-to-br ${chapter.color} p-1 rounded-3xl mb-12 shadow-2xl hover:shadow-3xl transition-all duration-500`}>
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${chapter.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <chapter.icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{chapter.title}</h2>
              <p className="text-xl text-white/80">{chapter.subtitle}</p>
            </div>
          </div>
          
          {renderChapterContent()}
        </div>
      </div>
    </div>
  );
}
