import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Clock, 
  Target, 
  Music, 
  Headphones, 
  Disc,
  Trophy,
  RotateCcw,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSpotifyStats } from '@/hooks/useSpotifyData';
import { useUnifiedCollectionStats } from '@/hooks/useUnifiedCollectionStats';
import { CollectionQuiz } from './CollectionQuiz';
import { toast } from 'sonner';

interface QuizSource {
  id: 'physical' | 'spotify' | 'mixed';
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  requiredData?: string;
}

export function EnhancedCollectionQuiz() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: spotifyStats } = useSpotifyStats();
  const { data: collectionStats } = useUnifiedCollectionStats();
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [showQuiz, setShowQuiz] = useState(false);

  const quizSources: QuizSource[] = [
    {
      id: 'physical',
      name: 'Fysieke Collectie',
      description: 'Quiz over je gescande vinyl en CD\'s',
      icon: <Disc className="w-5 h-5" />,
      available: (collectionStats?.totalItems || 0) > 0,
      requiredData: 'Gescande vinyl/CD collectie',
    },
    {
      id: 'spotify',
      name: 'Spotify Bibliotheek',
      description: 'Quiz over je Spotify luistergewoonten',
      icon: <Headphones className="w-5 h-5" />,
      available: !!(profile as any)?.spotify_connected && (spotifyStats?.totalTracks || 0) > 0,
      requiredData: 'Gekoppelde Spotify account',
    },
    {
      id: 'mixed',
      name: 'Gecombineerd',
      description: 'Quiz over je complete muziekcollectie',
      icon: <Music className="w-5 h-5" />,
      available: 
        (collectionStats?.totalItems || 0) > 0 && 
        !!(profile as any)?.spotify_connected && 
        (spotifyStats?.totalTracks || 0) > 0,
      requiredData: 'Zowel fysieke collectie als Spotify',
    },
  ];

  const handleStartQuiz = (sourceId: string) => {
    const source = quizSources.find(s => s.id === sourceId);
    if (!source?.available) {
      toast.error(`${source?.requiredData || 'Deze quiz bron'} is niet beschikbaar`);
      return;
    }
    
    setSelectedSource(sourceId);
    setShowQuiz(true);
  };

  const handleBackToSelection = () => {
    setShowQuiz(false);
    setSelectedSource('');
  };

  if (showQuiz) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Collectie Quiz - {quizSources.find(s => s.id === selectedSource)?.name}
          </h2>
          <Button variant="outline" onClick={handleBackToSelection}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Terug naar Selectie
          </Button>
        </div>
        <CollectionQuiz />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center">
          <Brain className="w-6 h-6 mr-2" />
          Collectie Quiz
        </h2>
        <p className="text-muted-foreground">
          Test je kennis van je muziekcollectie! Kies een bron om te beginnen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quizSources.map((source) => (
          <Card 
            key={source.id} 
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              source.available 
                ? 'border-green-200 hover:border-green-300' 
                : 'border-gray-200 opacity-60'
            }`}
            onClick={() => source.available && handleStartQuiz(source.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  source.available 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {source.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                </div>
                {source.available && (
                  <Badge variant="default" className="bg-green-500">
                    Beschikbaar
                  </Badge>
                )}
                {!source.available && (
                  <Badge variant="secondary">
                    Niet beschikbaar
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {source.description}
              </p>
              
              {source.id === 'physical' && collectionStats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Totaal items:</span>
                    <span className="font-semibold">{collectionStats.totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Waarde:</span>
                    <span className="font-semibold">€{collectionStats.totalValue}</span>
                  </div>
                </div>
              )}
              
              {source.id === 'spotify' && spotifyStats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tracks:</span>
                    <span className="font-semibold">{spotifyStats.totalTracks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Playlists:</span>
                    <span className="font-semibold">{spotifyStats.totalPlaylists}</span>
                  </div>
                </div>
              )}
              
              {source.id === 'mixed' && collectionStats && spotifyStats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fysiek + Digitaal:</span>
                    <span className="font-semibold">
                      {collectionStats.totalItems + spotifyStats.totalTracks} items
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Databronnen:</span>
                    <span className="font-semibold">2</span>
                  </div>
                </div>
              )}
              
              {!source.available && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Vereist:</strong> {source.requiredData}
                  </p>
                </div>
              )}
              
              {source.available && (
                <Button 
                  className="w-full mt-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartQuiz(source.id);
                  }}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">🎯 Nieuwe Quiz Features!</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Spotify Integratie:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Vragen over je top tracks</li>
              <li>• Playlist kennis</li>
              <li>• Audio features herkenning</li>
              <li>• Luistergewoonten</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Verbeterde AI:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Slimmere vragen</li>
              <li>• Cross-platform vergelijking</li>
              <li>• Persoonlijke insights</li>
              <li>• Uitgebreidere statistieken</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}