
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
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-8 border border-blue-500/30">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                🎬 Het Grote Verhaal
              </h3>
              <p className="text-xl md:text-2xl text-white leading-relaxed font-medium">
                {analysis.collectionStory}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    📅 Tijdreis door de Muziek
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed mb-4">{analysis.culturalContext?.lifeTimeline}</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.culturalContext?.timeTravel?.map((era: string, index: number) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {era}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    🌍 Wereldkaart van Smaak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.culturalContext?.worldMap}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-purple-500/30">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                🧬 Jouw Muzikale DNA
              </h3>
              <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed font-medium">
                {analysis.musicPersonality.musicDNA}
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h4 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                    🎭 Wie Ben Je?
                  </h4>
                  <p className="text-white leading-relaxed">{analysis.musicPersonality.profile}</p>
                </div>
                
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h4 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                    ⭐ Jouw Superkrachten
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.musicPersonality.traits.map((trait: string, index: number) => (
                      <Badge key={index} className="bg-purple-500/20 text-purple-200 border-purple-500/30 text-sm px-3 py-1">
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
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🌟 Jouw Muzikale Netwerk
                </CardTitle>
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
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">🤝 Muzikale Vriendschappen</h4>
                    <div className="space-y-2">
                      {analysis.artistConnections?.collaborationWeb?.slice(0, 3).map((story: string, index: number) => (
                        <p key={index} className="text-white text-sm leading-relaxed">• {story}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">🦋 Evolutie van Smaak</h4>
                    <p className="text-white leading-relaxed">{analysis.artistConnections?.genreEvolution}</p>
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
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    ✨ Jouw Unieke Magie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.collectionInsights?.uniqueMagic}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30 hover:bg-purple-800/90 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    🧵 De Rode Draad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">{analysis.collectionInsights?.redThread}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🎯 Jouw Curation Stijl
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white leading-relaxed mb-6">{analysis.collectionInsights?.curationStyle}</p>
                
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

      case 'waarde':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-8 border border-green-500/30">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                🏴‍☠️ Schattenjacht in je Collectie
              </h3>
              <p className="text-xl text-white mb-8 leading-relaxed font-medium">
                {analysis.priceAnalysis?.treasureHunt || "De schatten in je collectie worden nog geanalyseerd... ✨"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    📈 Jouw Investeringsverhaal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">
                    {analysis.priceAnalysis?.investmentStory || "Je investeringsstrategie wordt nog doorgelicht door onze experts! 🔍"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    🎪 Marktverhalen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white leading-relaxed">
                    {analysis.priceAnalysis?.marketTales || "De markttrends voor jouw collectie worden nog uitgezocht! 📊"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🧙‍♂️ Verzamelaarswijsheid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white leading-relaxed mb-6">
                  {analysis.priceAnalysis?.collectorWisdom || "De wijze raad van oude platenbazen wordt voor je verzameld! 🎯"}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">🎨 Portfolio als Kunstwerk</h4>
                    <p className="text-white leading-relaxed">
                      {analysis.priceAnalysis?.portfolioStory || "De artistieke samenstelling van je collectie wordt geanalyseerd! 🖼️"}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">💎 Waardegeheimen</h4>
                    <p className="text-white leading-relaxed">
                      {analysis.priceAnalysis?.valueSecrets || "De geheimen van waardebepaling worden voor je ontrafeld! 🔮"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                💰 Verborgen Schatten
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.investmentInsights?.hiddenTreasures?.slice(0, 4).map((treasure: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl">💎</div>
                    <span className="text-white text-sm leading-relaxed">{treasure}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'future':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl p-8 border border-indigo-500/30">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                🚀 Jouw Volgende Muzikale Avonturen
              </h3>
              <p className="text-xl text-white mb-8 leading-relaxed">
                De toekomst van je collectie ligt vol met spannende mogelijkheden! Hier zijn de verhalen die nog geschreven moeten worden... ✨
              </p>
            </div>

            <Card className="bg-purple-900/80 backdrop-blur-sm border-purple-700/30">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  🗺️ Ontdekkingsreizen die je Wachten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations?.nextAdventures?.slice(0, 5).map((adventure: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-white leading-relaxed">{adventure}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    🌟 Nieuwe Werelden om te Verkennen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations?.genreExploration?.slice(0, 4).map((genre: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                        <span className="text-2xl">🎵</span>
                        <span className="text-white text-sm">{genre}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    🕳️ Ontbrekende Puzzelstukjes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations?.collectionGaps?.slice(0, 4).map((gap: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
                        <span className="text-white text-sm leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl p-6 border border-pink-500/20">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                🎭 Leuke Weetjes over Jouw Smaak
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.funFacts?.map((fact: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-xl">
                      {['🎈', '🎪', '🎭', '🎨', '🎯'][index % 5]}
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
