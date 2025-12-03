import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Share2, Home, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuizShare } from '@/hooks/useQuizShare';

interface Question {
  id: number;
  question: string;
  correctAnswer: string;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  quizType: string;
  onPlayAgain: () => void;
  answers: Record<number, string>;
  questions: Question[];
}

export function QuizResults({ 
  score, 
  totalQuestions, 
  quizType, 
  onPlayAgain,
  answers,
  questions 
}: QuizResultsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveQuizResult, getBadge } = useQuizShare();
  
  const percentage = Math.round((score / totalQuestions) * 100);
  const badge = getBadge(percentage);
  const pointsEarned = score * 10 + (percentage === 100 ? 50 : 0);

  // Save result to database
  useEffect(() => {
    if (user) {
      saveResult();
    }
  }, []);

  const saveResult = async () => {
    if (!user) return;

    try {
      // Save to quiz_results
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        quiz_type: quizType,
        questions_total: totalQuestions,
        questions_correct: score,
        score_percentage: percentage,
      });

      // Update leaderboard with points
      const { data: existing } = await supabase
        .from('quiz_leaderboard')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('quiz_leaderboard')
          .update({ 
            total_points: (existing.total_points || 0) + pointsEarned,
            weekly_points: (existing.total_points || 0) + pointsEarned,
          })
          .eq('user_id', user.id);
      }

      toast({
        title: `+${pointsEarned} punten!`,
        description: 'Je score is opgeslagen.',
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const getEmoji = () => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 75) return '🎉';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '😅';
    return '💪';
  };

  const getMessage = () => {
    if (percentage >= 90) return 'Fantastisch! Je bent een echte expert!';
    if (percentage >= 75) return 'Uitstekend! Zeer goed gedaan!';
    if (percentage >= 60) return 'Goed bezig! Mooie score!';
    if (percentage >= 40) return 'Niet slecht! Blijf oefenen!';
    return 'Blijf oefenen, je kunt het!';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        {/* Header with score */}
        <div className="bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 p-8 text-center">
          <div className="text-6xl mb-4">{getEmoji()}</div>
          <h2 className="text-3xl font-bold mb-2">Quiz Voltooid!</h2>
          <p className="text-muted-foreground">{getMessage()}</p>
        </div>

        <CardContent className="p-6">
          {/* Score display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{score}/{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{percentage}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-500">+{pointsEarned}</p>
              <p className="text-sm text-muted-foreground">Punten</p>
            </div>
          </div>

          {/* Badge earned */}
          <div className={`p-4 rounded-lg mb-6 ${badge.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{badge.emoji}</span>
              <div>
                <p className="font-semibold">{badge.title}</p>
                <p className="text-sm opacity-80">Badge verdiend!</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onPlayAgain} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Opnieuw Spelen
            </Button>
            <Link to="/quizzen" className="w-full">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Quiz Hub
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Question review */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Antwoorden Overzicht</h3>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;
              return (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg border ${
                    isCorrect 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.question}</p>
                      <p className="text-xs text-muted-foreground">
                        {isCorrect ? (
                          <span className="text-green-600">Correct: {q.correctAnswer}</span>
                        ) : (
                          <>
                            <span className="text-red-600">Jouw antwoord: {answers[i]}</span>
                            {' • '}
                            <span className="text-green-600">Correct: {q.correctAnswer}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
