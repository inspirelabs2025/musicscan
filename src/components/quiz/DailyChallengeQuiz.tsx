import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Clock, Target, Users, CheckCircle, XCircle, ArrowRight, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  category?: string;
}

interface DailyChallenge {
  id: string;
  challenge_date: string;
  quiz_data: {
    questions: Question[];
  };
  category_mix: string[] | null;
}

interface LeaderboardEntry {
  user_id: string;
  score: number;
  time_taken_seconds: number;
  display_name?: string;
}

export function DailyChallengeQuiz() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's challenge
  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['daily-challenge', today],
    queryFn: async (): Promise<DailyChallenge | null> => {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Check if user already played today
  const { data: existingResult } = useQuery({
    queryKey: ['daily-challenge-result', today, user?.id],
    queryFn: async () => {
      if (!user || !challenge) return null;
      
      const { data, error } = await supabase
        .from('daily_challenge_results')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!challenge,
  });

  // Fetch today's leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['daily-challenge-leaderboard', challenge?.id],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!challenge) return [];
      
      const { data, error } = await supabase
        .from('daily_challenge_results')
        .select('user_id, score, time_taken_seconds')
        .eq('challenge_id', challenge.id)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!challenge,
  });

  // Save result mutation
  const saveResult = useMutation({
    mutationFn: async (result: { score: number; timeTaken: number }) => {
      if (!user || !challenge) throw new Error('Not authenticated or no challenge');
      
      // Save to daily_challenge_results for leaderboard
      const { error: dailyError } = await supabase
        .from('daily_challenge_results')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          score: result.score,
          time_taken_seconds: result.timeTaken,
        });

      if (dailyError) throw dailyError;

      // Also save to quiz_results for user's quiz history
      const { error: quizError } = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          quiz_type: 'daily',
          questions_correct: result.score,
          questions_total: totalQuestions,
          score_percentage: Math.round((result.score / totalQuestions) * 100),
          time_taken_seconds: result.timeTaken,
        });

      if (quizError) throw quizError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-result'] });
      queryClient.invalidateQueries({ queryKey: ['user-quiz-results'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-leaderboard'] });
    },
  });

  useEffect(() => {
    if (existingResult) {
      setHasPlayed(true);
      setIsComplete(true);
      setScore(existingResult.score);
    }
  }, [existingResult]);

  const questions = challenge?.quiz_data?.questions || [];
  const currentQ = questions[currentQuestion];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + (isAnswered ? 1 : 0)) / totalQuestions) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    if (answer === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuestionStartTime(Date.now());
    } else {
      // Quiz complete
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setIsComplete(true);
      
      if (user && !hasPlayed) {
        saveResult.mutate({ score, timeTaken });
      }
    }
  };

  if (challengeLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!challenge || !questions.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Geen Challenge Vandaag</h2>
          <p className="text-muted-foreground mb-6">
            De dagelijkse challenge voor vandaag is nog niet beschikbaar. Kom later terug!
          </p>
          <Link to="/quizzen">
            <Button>Terug naar Quizzen</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const userRank = leaderboard?.findIndex(e => e.user_id === user?.id) ?? -1;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-2">
              {hasPlayed ? 'Je Resultaat van Vandaag' : 'Challenge Voltooid!'}
            </h2>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge className="text-lg px-4 py-2 bg-primary/20">
                {score}/{totalQuestions} correct
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {percentage}%
              </Badge>
            </div>

            {!user && (
              <p className="text-muted-foreground mb-4">
                <Link to="/auth" className="text-primary hover:underline">Log in</Link> om je score op te slaan en mee te doen aan het leaderboard!
              </p>
            )}
          </div>

          {/* Today's Leaderboard */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" />
              Leaderboard van Vandaag
            </h3>
            
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div 
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.user_id === user?.id 
                        ? 'bg-primary/20 border border-primary/30' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold w-6">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span className={entry.user_id === user?.id ? 'font-semibold' : ''}>
                        {entry.user_id === user?.id ? 'Jij' : `Speler ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{entry.score}/{totalQuestions}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nog geen resultaten vandaag. Wees de eerste!
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Link to="/quizzen" className="flex-1">
              <Button variant="outline" className="w-full">
                Terug naar Quizzen
              </Button>
            </Link>
            {hasPlayed && (
              <Link to="/mijn-quizzen" className="flex-1">
                <Button className="w-full">
                  Mijn Scores
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="bg-primary/20">
            <Target className="w-3 h-3 mr-1" />
            Dagelijkse Challenge
          </Badge>
          <span className="text-sm text-muted-foreground">
            Vraag {currentQuestion + 1} van {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="p-6">
        {currentQ.category && (
          <Badge variant="outline" className="mb-3">
            {currentQ.category}
          </Badge>
        )}
        
        <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
        
        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, index) => {
            const isCorrect = option === currentQ.correctAnswer;
            const isSelected = option === selectedAnswer;
            
            let buttonClass = 'w-full justify-start text-left h-auto py-3 px-4';
            
            if (isAnswered) {
              if (isCorrect) {
                buttonClass += ' bg-green-500/20 border-green-500 text-green-700 dark:text-green-400';
              } else if (isSelected && !isCorrect) {
                buttonClass += ' bg-red-500/20 border-red-500 text-red-700 dark:text-red-400';
              } else {
                buttonClass += ' opacity-50';
              }
            } else if (isSelected) {
              buttonClass += ' border-primary bg-primary/10';
            }
            
            return (
              <Button
                key={index}
                variant="outline"
                className={buttonClass}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
              >
                <span className="flex items-center gap-2">
                  {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  {option}
                </span>
              </Button>
            );
          })}
        </div>
        
        {isAnswered && currentQ.explanation && (
          <div className="p-4 rounded-lg bg-muted/50 mb-4">
            <p className="text-sm text-muted-foreground">{currentQ.explanation}</p>
          </div>
        )}
        
        {isAnswered && (
          <Button 
            onClick={handleNext} 
            className="w-full bg-gradient-to-r from-primary to-purple-600"
          >
            {currentQuestion < totalQuestions - 1 ? (
              <>
                Volgende Vraag
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Bekijk Resultaat
                <Trophy className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
