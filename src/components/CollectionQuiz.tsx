import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, Trophy, Target, RotateCcw, Play, CheckCircle2, XCircle, Timer, Music, Disc3, Shuffle } from 'lucide-react';

interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface CollectionStats {
  totalAlbums?: number;
  totalArtists: number;
  genres?: number;
  yearRange?: string;
  totalTracks?: number;
  totalPlaylists?: number;
  topArtists?: string[];
  spotifyTracks?: number;
  spotifyPlaylists?: number;
}

type QuizMode = 'physical_only' | 'spotify_only' | 'mixed' | 'auto';

export function CollectionQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Quiz state
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(30);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQuizMode, setSelectedQuizMode] = useState<QuizMode>('auto');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [currentQuizMode, setCurrentQuizMode] = useState<QuizMode>('auto');

  const generateQuiz = async (questionCount: number = 10, quizMode: QuizMode = selectedQuizMode) => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('collection-quiz-generator', {
        body: { questionCount, quizMode }
      });

      if (error) {
        console.error('Quiz generation error:', error);
        throw error;
      }

      if (data.success) {
        setQuiz(data.quiz);
        setCollectionStats(data.collectionStats);
        setCurrentQuizMode(data.quizMode);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setScore(0);
        setTimer(30);
        setShowResult(false);
        setSelectedAnswer(null);
        setShowModeSelector(false);
        toast({
          title: "Quiz gegenereerd!",
          description: `${getQuizModeLabel(data.quizMode)} quiz met ${data.quiz.questions.length} vragen`,
        });
      }
    } catch (error: any) {
      console.error('Failed to generate quiz:', error);
      if (error.message.includes('No collection or Spotify data found')) {
        toast({
          title: "Geen data gevonden",
          description: "Verbind eerst Spotify of scan enkele albums om de quiz te gebruiken",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Quiz fout",
          description: error.message || 'Er ging iets mis bij het genereren van de quiz',
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = useCallback((answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  }, [showResult]);

  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showResult) return;
    
    const currentQuestion = quiz!.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setUserAnswers(prev => [...prev, selectedAnswer]);
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setShowResult(true);
  }, [selectedAnswer, showResult, quiz, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimer(30);
    } else {
      completeQuiz();
    }
  }, [currentQuestionIndex, quiz]);

  const completeQuiz = useCallback(() => {
    setIsQuizComplete(true);
    setRoundsCompleted(prev => prev + 1);
    setTotalScore(prev => prev + score);
  }, [score]);

  const continueQuiz = useCallback(() => {
    setIsQuizComplete(false);
    generateQuiz();
  }, []);

  const finishQuiz = useCallback(() => {
    // Save quiz results to database
    if (user && quiz) {
      supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          quiz_type: currentQuizMode,
          questions_total: quiz.questions.length,
          questions_correct: score,
          score_percentage: Math.round((score / quiz.questions.length) * 100)
        });
    }
    
    toast({
      title: "Quiz voltooid!",
      description: `${totalScore + score} punten in ${roundsCompleted + 1} ronde${roundsCompleted > 0 ? 's' : ''}`,
    });
  }, [user, quiz, score, totalScore, roundsCompleted, currentQuizMode]);

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setScore(0);
    setShowResult(false);
    setTimer(30);
    setRoundsCompleted(0);
    setTotalScore(0);
    setIsQuizComplete(false);
    setCollectionStats(null);
    setShowModeSelector(true);
    setSelectedQuizMode('auto');
    setCurrentQuizMode('auto');
  };

  const getQuizModeLabel = (mode: QuizMode) => {
    switch (mode) {
      case 'physical_only': return 'Fysieke Collectie';
      case 'spotify_only': return 'Spotify';
      case 'mixed': return 'Mixed (Fysiek + Spotify)';
      default: return 'Auto';
    }
  };

  const getQuizModeIcon = (mode: QuizMode) => {
    switch (mode) {
      case 'physical_only': return <Disc3 className="w-4 h-4" />;
      case 'spotify_only': return <Music className="w-4 h-4" />;
      case 'mixed': return <Shuffle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Timer effect
  useEffect(() => {
    if (quiz && !showResult && !isQuizComplete && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (!selectedAnswer) {
              setSelectedAnswer('TIMEOUT');
            }
            submitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [quiz, showResult, isQuizComplete, timer, selectedAnswer, submitAnswer]);

  // Quiz mode selector
  if (showModeSelector) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              Muziek Quiz
            </CardTitle>
            <CardDescription className="text-lg">
              Test je kennis van je muziekcollectie en luistergedrag!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Kies je quiz type:</h3>
              <div className="grid gap-3">
                <Button
                  onClick={() => setSelectedQuizMode('physical_only')}
                  variant={selectedQuizMode === 'physical_only' ? 'default' : 'outline'}
                  size="lg"
                  className="gap-2 justify-start"
                >
                  <Disc3 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Fysieke Collectie Quiz</div>
                    <div className="text-sm opacity-70">Gebaseerd op je vinyl & CD scans</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedQuizMode('spotify_only')}
                  variant={selectedQuizMode === 'spotify_only' ? 'default' : 'outline'}
                  size="lg"
                  className="gap-2 justify-start"
                >
                  <Music className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Spotify Quiz</div>
                    <div className="text-sm opacity-70">Gebaseerd op je luistergedrag</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedQuizMode('mixed')}
                  variant={selectedQuizMode === 'mixed' ? 'default' : 'outline'}
                  size="lg"
                  className="gap-2 justify-start"
                >
                  <Shuffle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Mixed Quiz</div>
                    <div className="text-sm opacity-70">Combinatie van fysiek en digitaal</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedQuizMode('auto')}
                  variant={selectedQuizMode === 'auto' ? 'default' : 'outline'}
                  size="lg"
                  className="gap-2 justify-start"
                >
                  <Target className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Auto Quiz</div>
                    <div className="text-sm opacity-70">Laat het systeem kiezen</div>
                  </div>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={() => generateQuiz(10)}
                  disabled={isGenerating}
                  size="lg"
                  className="gap-2"
                >
                  <Play className="w-5 h-5" />
                  {isGenerating ? 'Genereren...' : 'Korte Quiz (10 vragen)'}
                </Button>
                <Button
                  onClick={() => generateQuiz(20)}
                  disabled={isGenerating}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Target className="w-5 h-5" />
                  {isGenerating ? 'Genereren...' : 'Uitgebreide Quiz (20 vragen)'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz completed state
  if (isQuizComplete) {
    const percentage = Math.round((score / quiz!.questions.length) * 100);
    const totalPercentage = Math.round(((totalScore + score) / ((roundsCompleted + 1) * quiz!.questions.length)) * 100);
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {getQuizModeIcon(currentQuizMode)}
                {getQuizModeLabel(currentQuizMode)} Quiz Voltooid! 🎉
              </CardTitle>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Ronde {roundsCompleted + 1}
              </Badge>
            </div>
            <CardDescription>
              Je hebt {score} van de {quiz!.questions.length} vragen goed beantwoord
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">{score}/{quiz!.questions.length}</div>
              <div className="text-2xl">{percentage}% correct</div>
              
              {roundsCompleted > 0 && (
                <div className="text-muted-foreground">
                  Totaal: {totalScore + score} punten in {roundsCompleted + 1} rondes ({totalPercentage}% gemiddeld)
                </div>
              )}
              
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {percentage >= 90 ? '🏆 Quiz Expert' :
                 percentage >= 75 ? '🎵 Muziekkenner' :
                 percentage >= 60 ? '📀 Goede Score' : '🎧 Blijf Oefenen'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={continueQuiz} className="gap-2">
                <Play className="w-4 h-4" />
                Nieuwe Ronde
              </Button>
              <Button onClick={finishQuiz} variant="outline" className="gap-2">
                <Trophy className="w-4 h-4" />
                Quiz Beëindigen
              </Button>
            </div>
            
            <Button onClick={resetQuiz} variant="ghost" className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              Nieuwe Quiz Starten
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  if (quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getQuizModeIcon(currentQuizMode)}
                  {getQuizModeLabel(currentQuizMode)} Quiz
                </CardTitle>
                <CardDescription>
                  Vraag {currentQuestionIndex + 1} van {quiz.questions.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className={timer <= 10 ? 'text-destructive font-bold' : ''}>{timer}s</span>
                </div>
                <div className="text-sm text-muted-foreground">Score: {score}/{currentQuestionIndex + (showResult ? 1 : 0)}</div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-xl font-medium">{currentQuestion.question}</div>
            
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showResult
                      ? option === currentQuestion.correctAnswer
                        ? 'default'
                        : selectedAnswer === option
                        ? 'destructive'
                        : 'outline'
                      : selectedAnswer === option
                      ? 'default'
                      : 'outline'
                  }
                  className="text-left justify-start h-auto py-4 px-4"
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3">
                    {showResult && option === currentQuestion.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {showResult && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>{option}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            {showResult && (
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Fout antwoord'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between">
              {!showResult ? (
                <Button 
                  onClick={submitAnswer} 
                  disabled={!selectedAnswer}
                  className="ml-auto"
                >
                  Bevestigen
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="ml-auto">
                  {currentQuestionIndex < quiz.questions.length - 1 ? 'Volgende Vraag' : 'Quiz Voltooien'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}