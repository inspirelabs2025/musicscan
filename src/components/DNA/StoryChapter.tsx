
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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
          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-white/80">
                {analysis.collectionStory}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Cultural Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.culturalContext.decades.map((decade: string, index: number) => (
                      <Badge key={index} className="mr-2 mb-2 bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {decade}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Geographic Spread</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">{analysis.culturalContext.geography}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">Your Musical DNA</h3>
              <p className="text-xl text-purple-200 mb-6">{analysis.musicPersonality.musicDNA}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Personality Profile</h4>
                  <p className="text-white/80">{analysis.musicPersonality.profile}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Key Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.musicPersonality.traits.map((trait: string, index: number) => (
                      <Badge key={index} className="bg-purple-500/20 text-purple-200 border-purple-500/30">
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
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Artist Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topArtists?.slice(0, 8)}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#fff', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="albums" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Collaborations</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.artistConnections.collaborations.slice(0, 5).map((collab: string, index: number) => (
                        <Badge key={index} className="bg-pink-500/20 text-pink-200 border-pink-500/30">
                          {collab}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Genre Evolution</h4>
                    <p className="text-white/80">{analysis.artistConnections.genreEvolution}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Collection Uniqueness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">{analysis.collectionInsights.uniqueness}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Investment Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-2">Hidden Gems</h4>
                      {analysis.investmentInsights.hiddenGems.slice(0, 3).map((gem: string, index: number) => (
                        <Badge key={index} className="mr-2 mb-1 bg-green-500/20 text-green-200 border-green-500/30 text-xs">
                          {gem}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-white/70 text-sm">{analysis.investmentInsights.trends}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Genre Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.genreDistribution?.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.genreDistribution?.slice(0, 6).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'][index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'future':
        return (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Recommended Next Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.nextPurchases.slice(0, 5).map((rec: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Genre Exploration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.recommendations.genreExploration.slice(0, 4).map((genre: string, index: number) => (
                      <Badge key={index} className="mr-2 mb-2 bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Collection Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.recommendations.collectionGaps.slice(0, 3).map((gap: string, index: number) => (
                      <div key={index} className="text-white/70 text-sm">• {gap}</div>
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
      className={`transition-all duration-1000 ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}
      onClick={onActivate}
    >
      <div className={`bg-gradient-to-br ${chapter.color} p-1 rounded-2xl mb-8`}>
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${chapter.color} rounded-full flex items-center justify-center`}>
              <chapter.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{chapter.title}</h2>
              <p className="text-xl text-white/70">{chapter.subtitle}</p>
            </div>
          </div>
          
          {renderChapterContent()}
        </div>
      </div>
    </div>
  );
}
