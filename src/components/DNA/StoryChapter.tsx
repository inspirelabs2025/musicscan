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
      case 'genesis':
        return (
          <div className="space-y-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg md:text-xl leading-relaxed text-white">
                {analysis.collectionStory}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Culturele Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {analysis.culturalContext.decades.map((decade: string, index: number) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                          {decade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Geografische Spreiding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white">{analysis.culturalContext.geography}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-500/30">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Jouw Muzikale DNA</h3>
              <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">{analysis.musicPersonality.musicDNA}</p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-white mb-4 text-lg">Persoonlijkheidsprofiel</h4>
                  <p className="text-white leading-relaxed">{analysis.musicPersonality.profile}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-4 text-lg">Hoofdkenmerken</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.musicPersonality.traits.map((trait: string, index: number) => (
                      <Badge key={index} className="bg-purple-500/20 text-purple-200 border-purple-500/30 text-sm">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl">Artiest Netwerk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topArtists?.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#fff', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: '#fff',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Bar dataKey="albums" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-4">Samenwerkingen</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.artistConnections.collaborations.slice(0, 5).map((collab: string, index: number) => (
                        <Badge key={index} className="bg-pink-500/20 text-pink-200 border-pink-500/30 text-sm">
                          {collab}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-4">Genre Evolutie</h4>
                    <p className="text-white leading-relaxed">{analysis.artistConnections.genreEvolution}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30 hover:bg-purple-800/90 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Collectie Uniciteit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.collectionInsights.uniqueness}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30 hover:bg-purple-800/90 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Investering Inzichten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Verborgen Parels</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.investmentInsights.hiddenGems.slice(0, 3).map((gem: string, index: number) => (
                          <Badge key={index} className="bg-green-500/20 text-green-200 border-green-500/30 text-sm">
                            {gem}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-white leading-relaxed">{analysis.investmentInsights.trends}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl">Genre Verdeling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.genreDistribution?.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.genreDistribution?.slice(0, 6).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'][index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: '#fff',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                  {chartData.genreDistribution?.slice(0, 6).map((genre: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'][index] }}
                      />
                      <span className="text-white text-sm">{genre.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'future':
        return (
          <div className="space-y-8">
            <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Aanbevolen Volgende Aankopen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.nextPurchases.slice(0, 5).map((rec: string, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-white">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Genre Verkenning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendations.genreExploration.slice(0, 4).map((genre: string, index: number) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Collectie Gaten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations.collectionGaps.slice(0, 3).map((gap: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
                        <span className="text-white text-sm leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div className="text-white">Chapter content loading...</div>;
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
