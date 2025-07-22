import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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
      case 'highlights':
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30 hover:bg-purple-800/90 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    🎭 Muzikaal Vakmanschap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.collectionProfile.musicianship}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30 hover:bg-purple-800/90 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    🌟 Culturele Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.collectionProfile.culturalImpact}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  📅 Tijdreis door de Muziek
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white leading-relaxed mb-6">{analysis.historicalContext.timeline}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Muzikale Bewegingen</h4>
                    <div className="space-y-2">
                      {analysis.historicalContext.movements.map((movement, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <span className="text-white text-sm">{movement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Innovaties</h4>
                    <div className="space-y-2">
                      {analysis.historicalContext.innovations.map((innovation, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <span className="text-white text-sm">{innovation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'connections':
        return (
          <div className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🌟 Artistieke Verbindingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-white mb-4">Samenwerkingen</h4>
                    <div className="space-y-2">
                      {analysis.artisticConnections.collaborations.map((collab, index) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg">
                          <p className="text-white text-sm">{collab}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-4">Invloeden</h4>
                    <div className="space-y-2">
                      {analysis.artisticConnections.influences.map((influence, index) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg">
                          <p className="text-white text-sm">{influence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-4">Label Erfgoed</h4>
                  <p className="text-white leading-relaxed">{analysis.artisticConnections.labelLegacy}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Genres & Stijlen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.musicalAnalysis.genres.map((genre, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{genre}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Klankkleuren</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.musicalAnalysis.soundscapes.map((soundscape, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{soundscape}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl">Technische Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Formats & Pressingen</h4>
                    <p className="text-white text-sm leading-relaxed">{analysis.technicalDetails.formats}</p>
                    <p className="text-white text-sm leading-relaxed mt-2">{analysis.technicalDetails.pressings}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Geluidskwaliteit & Verpakking</h4>
                    <p className="text-white text-sm leading-relaxed">{analysis.technicalDetails.soundQuality}</p>
                    <p className="text-white text-sm leading-relaxed mt-2">{analysis.technicalDetails.packaging}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Waardevolle Vondsten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.marketAnalysis.valuableFinds.map((find, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-white">{find}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Markttrends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.marketAnalysis.marketTrends.map((trend, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{trend}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Bewaar Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.marketAnalysis.preservationTips.map((tip, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'discover':
        return (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border-indigo-500/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Verborgen Parels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.collectionInsights.hiddenGems.map((gem, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-white">{gem}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Volgende Ontdekkingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.collectionInsights.nextDiscoveries.map((discovery, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{discovery}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Collectie Aanvullingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.collectionInsights.completionSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                🎯 Leuke Weetjes
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.funFacts.map((fact, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                    <div className="text-xl">
                      {['🎵', '🎸', '🎹', '🎺', '🎼'][index % 5]}
                    </div>
                    <span className="text-white text-sm leading-relaxed">{fact}</span>
                  </div>
                ))}
              </div>
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
              <p className="text-xl text-white">{chapter.subtitle}</p>
            </div>
          </div>
          
          {renderChapterContent()}
        </div>
      </div>
    </div>
  );
}
