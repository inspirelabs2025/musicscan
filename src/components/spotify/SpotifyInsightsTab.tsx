import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, RefreshCw, Loader2, TrendingUp, Target, Sparkles,
  Heart, Zap, Disc3, Lightbulb, Compass, Music, Layers,
  GitBranch, Eye, Clock, BarChart3
} from 'lucide-react';
import type { SpotifyAIResult } from '@/hooks/useSpotifyAIAnalysis';

interface SpotifyInsightsTabProps {
  aiAnalysis: SpotifyAIResult | undefined;
  aiLoading: boolean;
  refetchAI: () => void;
  audioFeatures: any;
}

export const SpotifyInsightsTab: React.FC<SpotifyInsightsTabProps> = ({
  aiAnalysis,
  aiLoading,
  refetchAI,
  audioFeatures,
}) => {
  const analysis = aiAnalysis?.analysis;

  return (
    <div className="space-y-6">
      {/* Header + Analyse Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#1DB954]" /> Slimme Analyse 2.0
          </h2>
          <p className="text-sm text-muted-foreground">Diepgaande inzichten over je muziekprofiel</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAI()}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-1">{aiLoading ? 'Analyseren...' : 'Analyse starten'}</span>
        </Button>
      </div>

      {aiLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* 1. Personality Hero */}
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-r from-[#15803d] via-[#191414] to-[#191414] p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{analysis.personality?.title}</h3>
              <p className="text-white/90 leading-relaxed">{analysis.personality?.summary}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {analysis.personality?.traits?.map((trait) => (
                  <Badge key={trait} className="bg-white/20 text-white border-white/30 hover:bg-white/30">{trait}</Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* 2. Explorer Score + Emotional Landscape */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explorer Profile */}
            {analysis.explorerProfile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Compass className="w-5 h-5 text-[#1DB954]" /> Ontdekker Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-28 h-28">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#1DB954" strokeWidth="8"
                          strokeDasharray={`${(analysis.explorerProfile.score / 100) * 314} 314`}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-3xl font-bold">{analysis.explorerProfile.score}</span>
                    </div>
                    <p className="font-medium mt-2">{analysis.explorerProfile.label}</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>🎯 <strong>Diversiteit:</strong> {analysis.explorerProfile.diversity}</p>
                    <p>🔍 <strong>Obscuriteit:</strong> {analysis.explorerProfile.obscurity}</p>
                    <p>🚀 <strong>Avontuur:</strong> {analysis.explorerProfile.adventurousness}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emotional Landscape */}
            {analysis.emotionalLandscape && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-5 h-5 text-[#1DB954]" /> Emotioneel Landschap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{analysis.emotionalLandscape.description}</p>
                  <div className="space-y-3">
                    {analysis.emotionalLandscape.moodPalette?.map((mood) => (
                      <div key={mood.mood} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{mood.mood}</span>
                          <span className="text-muted-foreground">{mood.percentage}%</span>
                        </div>
                        <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${mood.percentage}%`, backgroundColor: mood.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 3. Genre Ecosystem */}
          {analysis.genreEcosystem && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-5 h-5 text-[#1DB954]" /> Genre Ecosysteem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{analysis.genreEcosystem.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">🎵 Hoofdgenres</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.genreEcosystem.mainGenres?.map((g) => (
                        <Badge key={g} className="bg-[#1DB954] text-white">{g}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">💎 Niche Genres</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.genreEcosystem.nicheGenres?.map((g) => (
                        <Badge key={g} variant="outline">{g}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">📊 Mainstream Ratio</p>
                    <div className="flex items-center gap-2">
                      <Progress value={analysis.genreEcosystem.mainstreamRatio} className="h-3 flex-1" />
                      <span className="text-sm font-medium">{analysis.genreEcosystem.mainstreamRatio}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysis.genreEcosystem.mainstreamRatio > 70 ? 'Mainstream luisteraar' : analysis.genreEcosystem.mainstreamRatio > 40 ? 'Gebalanceerd' : 'Underground luisteraar'}
                    </p>
                  </div>
                </div>
                {analysis.genreEcosystem.connections?.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">🔗 Genre-verbanden</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {analysis.genreEcosystem.connections.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. Listening Journey + Artist Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Listening Journey */}
            {analysis.listeningJourney && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-5 h-5 text-[#1DB954]" /> Luisterreis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{analysis.listeningJourney.evolution}</p>
                  <div className="space-y-3">
                    {analysis.listeningJourney.phases?.map((phase, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-[#1DB954]" />
                          {i < (analysis.listeningJourney.phases?.length || 0) - 1 && (
                            <div className="w-0.5 flex-1 bg-[#1DB954]/30 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium">{phase.period}</p>
                          <p className="text-xs text-muted-foreground">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {analysis.listeningJourney.turningPoints?.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">⚡ Keermomenten</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analysis.listeningJourney.turningPoints.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Artist Network */}
            {analysis.artistNetwork && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className="w-5 h-5 text-[#1DB954]" /> Artiest Netwerk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{analysis.artistNetwork.description}</p>
                  <div className="space-y-3">
                    {analysis.artistNetwork.clusters?.map((cluster, i) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">{cluster.name}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {cluster.artists?.map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{cluster.connection}</p>
                      </div>
                    ))}
                  </div>
                  {analysis.artistNetwork.influences?.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">🎯 Invloedlijnen</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analysis.artistNetwork.influences.map((inf, i) => <li key={i}>• {inf}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 5. Collection Bridge (Fysiek vs. Digitaal) */}
          {aiAnalysis?.metadata?.hasPhysicalCollection && analysis.collectionBridge && (
            <Card className="border-2 border-dashed border-[#1DB954]/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Disc3 className="w-5 h-5 text-[#1DB954]" /> Fysiek vs. Digitaal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats row */}
                {analysis.collectionBridge.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Fysiek', value: analysis.collectionBridge.stats.totalPhysical, icon: '📀' },
                      { label: 'Spotify', value: analysis.collectionBridge.stats.totalSpotify, icon: '🎧' },
                      { label: 'Overlap', value: analysis.collectionBridge.stats.overlap, icon: '🤝' },
                      { label: 'Alleen fysiek', value: analysis.collectionBridge.stats.onlyPhysical, icon: '💿' },
                      { label: 'Alleen digitaal', value: analysis.collectionBridge.stats.onlySpotify, icon: '☁️' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-lg">{stat.icon}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">{analysis.collectionBridge.overlapInsight}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium mb-1">🎵 Genre Verschuiving</p>
                    <p className="text-xs text-muted-foreground">{analysis.collectionBridge.genreShifts}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium mb-1">📅 Decennia Verschuiving</p>
                    <p className="text-xs text-muted-foreground">{analysis.collectionBridge.decadeShifts}</p>
                  </div>
                </div>

                {/* Blind Spots */}
                {analysis.collectionBridge.blindSpots && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-orange-500 mb-1">📀 Mist fysiek (veel gestreamed)</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.collectionBridge.blindSpots.physicalMissing?.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-orange-300">{a}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-500 mb-1">☁️ Mist digitaal (wel fysiek)</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.collectionBridge.blindSpots.digitalMissing?.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-blue-300">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.collectionBridge.suggestions?.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">💡 Suggesties</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {analysis.collectionBridge.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 6. Trends + Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.trends && (
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[#1DB954]" /> Trends & Patronen
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{analysis.trends.description}</p>
                  {analysis.trends.rising?.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-[#1DB954]">📈 Stijgend:</span>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        {analysis.trends.rising.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                  {analysis.trends.declining?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-orange-500">📉 Dalend:</span>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        {analysis.trends.declining.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis.recommendations && (
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#1DB954]" /> Aanbevelingen
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{analysis.recommendations.description}</p>
                  <div className="space-y-2">
                    {analysis.recommendations.artists?.slice(0, 5).map((a, i) => (
                      <div key={i} className="text-xs flex items-start gap-1">
                        <Sparkles className="w-3 h-3 text-[#1DB954] mt-0.5 flex-shrink-0" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                  {analysis.recommendations.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {analysis.recommendations.genres.map((g, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  )}
                  {analysis.recommendations.albums?.length > 0 && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs font-medium mb-1">💿 Album suggesties</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analysis.recommendations.albums.map((a, i) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 7. Hidden Gems */}
          {analysis.hiddenGems && (
            <Card>
              <CardContent className="p-5">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-[#1DB954]" /> Verborgen Parels
                </h4>
                <p className="text-sm text-muted-foreground mb-3">{analysis.hiddenGems.description}</p>
                <div className="space-y-2">
                  {analysis.hiddenGems.gems?.map((gem, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                      <span className="text-lg">💎</span>
                      <p className="text-sm text-muted-foreground">{gem}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 8. Fun Facts */}
          {analysis.funFacts?.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h4 className="font-medium mb-3">💡 Wist je dat...</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.funFacts.map((fact, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/20 rounded-lg">
                      <span className="text-sm">🎶</span>
                      <p className="text-sm text-muted-foreground">{fact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio Features (bestaand) */}
          {audioFeatures && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-[#1DB954]" /> Audio Profiel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Danceability', value: audioFeatures.danceability, emoji: '💃' },
                    { label: 'Energy', value: audioFeatures.energy, emoji: '⚡' },
                    { label: 'Vrolijkheid', value: audioFeatures.valence, emoji: '😊' },
                    { label: 'Akoestisch', value: audioFeatures.acousticness, emoji: '🎸' },
                    { label: 'Instrumentaal', value: audioFeatures.instrumentalness, emoji: '🎹' },
                    { label: 'Liveness', value: audioFeatures.liveness, emoji: '🎤' },
                  ].map((feature) => (
                    <div key={feature.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{feature.emoji} {feature.label}</span>
                        <span className="font-medium">{feature.value}%</span>
                      </div>
                      <Progress value={feature.value} className="h-2" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Tempo: {audioFeatures.tempo} BPM • {audioFeatures.sample_size} tracks geanalyseerd
                </p>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-right">
            Geanalyseerd: {aiAnalysis?.metadata?.tracksAnalyzed} tracks, {aiAnalysis?.metadata?.playlistCount} playlists
            {aiAnalysis?.metadata?.hasPhysicalCollection && ` • ${aiAnalysis.metadata.physicalCollectionSize} fysieke items`}
          </p>
        </div>
      ) : (
        <Card className="border-2 border-dashed border-[#1DB954]/20">
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Klaar voor analyse?</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Klik op "Analyse starten" voor een diepgaande analyse van je muziekprofiel met genre-ecosysteem, ontdekker-score, emotioneel landschap en meer.
            </p>
            <Button onClick={() => refetchAI()} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analyse starten
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
