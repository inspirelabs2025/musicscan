import React, { useState, useEffect, useMemo } from 'react';
import { Users, Play, ArrowLeft, Trophy, Loader2, Search, X, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  artistImage?: string;
}

interface Artist {
  artist_name: string;
  artwork_url: string | null;
  music_style: string[] | null;
}

export function ArtistQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Fetch artists on mount
  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoadingArtists(true);
      const { data, error } = await supabase
        .from('artist_stories')
        .select('artist_name, artwork_url, music_style')
        .eq('is_published', true)
        .not('artist_name', 'is', null)
        .order('artist_name');

      if (!error && data) {
        setArtists(data);
      }
      setIsLoadingArtists(false);
    };
    fetchArtists();
  }, []);

  // Filter artists based on search
  const filteredArtists = useMemo(() => {
    if (!searchTerm.trim()) return artists.slice(0, 12);
    const term = searchTerm.toLowerCase();
    return artists.filter(a => 
      a.artist_name.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [artists, searchTerm]);

  // Popular artists (first 6 with artwork)
  const popularArtists = useMemo(() => {
    return artists.filter(a => a.artwork_url).slice(0, 6);
  }, [artists]);

  const startQuiz = async () => {
    if (!selectedArtist) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-artist-quiz', {
        body: { artistName: selectedArtist.artist_name, questionCount: 10 }
      });

      if (error) throw error;

      if (data?.quiz?.questions?.length > 0) {
        setQuestions(data.quiz.questions);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowResults(false);
      } else {
        toast({
          title: 'Fout',
          description: 'Kon geen quiz vragen genereren. Probeer opnieuw.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het laden van de quiz.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 1000);
    } else {
      setTimeout(() => setShowResults(true), 1000);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedArtist(null);
    setSearchTerm('');
  };

  // Start screen with artist search
  if (!quizStarted) {
    return (
      <div className="min-h-[80vh] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-purple-600/20 -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -z-10" />
        
        {/* Floating music notes decoration */}
        <div className="absolute top-32 right-20 text-6xl opacity-10 animate-pulse">🎵</div>
        <div className="absolute bottom-40 left-16 text-5xl opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}>🎤</div>
        <div className="absolute top-60 left-1/4 text-4xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>🎸</div>
        
        <div className="max-w-2xl mx-auto px-4 py-8 relative">
          <Link to="/quizzen" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Terug naar Quiz Hub
          </Link>

          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
            {/* Header with gradient accent */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />
            
            <CardHeader className="text-center pt-8 pb-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Artiesten Quiz
              </CardTitle>
              <p className="text-muted-foreground text-lg mt-2">
                Kies een artiest en test je kennis met 10 vragen
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6 px-8 pb-8">
              {/* Artist Search */}
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Zoek een artiest
                </label>
                <div className="relative">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Typ een artiestnaam..."
                    className="h-12 pl-4 pr-10 bg-background/50"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results / Suggestions */}
                {isLoadingArtists ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {filteredArtists.map((artist) => (
                      <button
                        key={artist.artist_name}
                        onClick={() => setSelectedArtist(artist)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          selectedArtist?.artist_name === artist.artist_name
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-border hover:border-blue-500/50 hover:bg-muted/50'
                        }`}
                      >
                        {artist.artwork_url ? (
                          <img 
                            src={artist.artwork_url} 
                            alt={artist.artist_name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Music2 className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{artist.artist_name}</div>
                          {artist.music_style && artist.music_style.length > 0 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {artist.music_style.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                        {selectedArtist?.artist_name === artist.artist_name && (
                          <Badge className="bg-blue-500 text-white">Geselecteerd</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Artists (when no search) */}
              {!searchTerm && popularArtists.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Of kies uit populaire artiesten:</label>
                  <div className="flex flex-wrap gap-2">
                    {popularArtists.map((artist) => (
                      <button
                        key={artist.artist_name}
                        onClick={() => setSelectedArtist(artist)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          selectedArtist?.artist_name === artist.artist_name
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                            : 'border-border hover:border-blue-500/50'
                        }`}
                      >
                        {artist.artist_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Artist Preview */}
              {selectedArtist && (
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 flex items-center gap-4">
                  {selectedArtist.artwork_url ? (
                    <img 
                      src={selectedArtist.artwork_url} 
                      alt={selectedArtist.artist_name}
                      className="w-16 h-16 rounded-xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-lg">{selectedArtist.artist_name}</div>
                    {selectedArtist.music_style && selectedArtist.music_style.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedArtist.music_style.slice(0, 3).join(' • ')}
                      </div>
                    )}
                    <div className="text-sm text-blue-600 mt-1">10 vragen over deze artiest</div>
                  </div>
                  <button 
                    onClick={() => setSelectedArtist(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Info badges */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300">
                  ⭐ +10 punten per vraag
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  🏆 Leaderboard
                </Badge>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300">
                  🎲 Unieke vragen
                </Badge>
              </div>

              <Button 
                onClick={startQuiz} 
                disabled={isLoading || !selectedArtist}
                className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 h-14 text-lg font-semibold disabled:opacity-50"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Quiz wordt gegenereerd...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {selectedArtist ? `Start Quiz over ${selectedArtist.artist_name}` : 'Selecteer eerst een artiest'}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Elke quiz is uniek en wordt speciaal voor jou samengesteld
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const score = calculateScore();
    return (
      <QuizResults 
        score={score}
        totalQuestions={questions.length}
        quizType="artiesten"
        onPlayAgain={resetQuiz}
        answers={answers}
        questions={questions}
      />
    );
  }

  // Quiz in progress
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <QuizQuestion
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        selectedAnswer={currentAnswer}
        onAnswer={handleAnswer}
        showResult={!!currentAnswer}
      />
    </div>
  );
}