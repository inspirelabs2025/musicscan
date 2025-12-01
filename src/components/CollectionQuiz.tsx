import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuizShare } from '@/hooks/useQuizShare';
import { QuizShareDialog } from '@/components/quiz/QuizShareDialog';
import { Clock, Trophy, Target, RotateCcw, Play, CheckCircle2, XCircle, Timer, Music, Disc3, Shuffle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const { saveQuizResult, createChallenge, getBadge, isSaving } = useQuizShare();
  
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
  
  // Share state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [savedResult, setSavedResult] = useState<{ id: string; shareToken: string } | null>(null);

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

  const completeQuiz = useCallback(async () => {
    setIsQuizComplete(true);
    setRoundsCompleted(prev => prev + 1);
    setTotalScore(prev => prev + score);
    
    // Save result with share token
    if (user && quiz) {
      const percentage = Math.round((score / quiz.questions.length) * 100);
      const badge = getBadge(percentage);
      
      const result = await saveQuizResult(user.id, {
        score,
        totalQuestions: quiz.questions.length,
        percentage,
        quizType: currentQuizMode,
        badge
      });
      
      if (result) {
        setSavedResult(result);
      }
    }
  }, [score, user, quiz, currentQuizMode, saveQuizResult, getBadge]);

  const continueQuiz = useCallback(() => {
    setIsQuizComplete(false);
    generateQuiz();
  }, []);

  const finishQuiz = useCallback(() => {
    toast({
      title: "Quiz voltooid!",
      description: `${totalScore + score} punten in ${roundsCompleted + 1} ronde${roundsCompleted > 0 ? 's' : ''}`,
    });
    // Result is already saved in completeQuiz
  }, [score, totalScore, roundsCompleted, toast]);

  const handleCreateChallenge = useCallback(async () => {
    if (!user || !savedResult) return;
    
    const challengeToken = await createChallenge(
      user.id,
      savedResult.id,
      score,
      currentQuizMode,
      quiz!.questions.length
    );
    
    if (challengeToken) {
      const challengeUrl = `${window.location.origin}/quiz/challenge/${challengeToken}`;
      navigator.clipboard.writeText(challengeUrl);
      toast({
        title: "Challenge Link Gekopieerd!",
        description: "Deel deze link om je vrienden uit te dagen",
      });
    }
  }, [user, savedResult, score, currentQuizMode, quiz, createChallenge, toast]);

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
    setSavedResult(null);
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
    const badge = getBadge(percentage);
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
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
              <motion.div 
                className="text-center space-y-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="text-5xl font-bold text-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                >
                  {percentage}%
                </motion.div>
                <div className="text-xl text-muted-foreground">{score}/{quiz!.questions.length} correct</div>
                
                {roundsCompleted > 0 && (
                  <div className="text-muted-foreground">
                    Totaal: {totalScore + score} punten in {roundsCompleted + 1} rondes ({totalPercentage}% gemiddeld)
                  </div>
                )}
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge variant="secondary" className={`text-lg px-4 py-2 ${badge.color}`}>
                    <span className="text-xl mr-2">{badge.emoji}</span>
                    {badge.title}
                  </Badge>
                </motion.div>
              </motion.div>
              
              {/* Share Button - Primary Action */}
              {savedResult && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    onClick={() => setShowShareDialog(true)} 
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    <Share2 className="w-5 h-5" />
                    Deel je Score & Daag Vrienden Uit!
                  </Button>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={continueQuiz} variant="outline" className="gap-2">
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
        </motion.div>
        
        {/* Share Dialog */}
        {savedResult && (
          <QuizShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            score={score}
            totalQuestions={quiz!.questions.length}
            percentage={percentage}
            badge={badge}
            shareToken={savedResult.shareToken}
            quizType={getQuizModeLabel(currentQuizMode)}
            onCreateChallenge={handleCreateChallenge}
          />
        )}
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