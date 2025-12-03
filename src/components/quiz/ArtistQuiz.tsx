import React, { useState } from 'react';
import { Users, Play, ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type Difficulty = 'easy' | 'medium' | 'hard';

export function ArtistQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [genre, setGenre] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-artist-quiz', {
        body: { difficulty, genre: genre || undefined, questionCount: 10 }
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
  };

  // Start screen
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
                Test je kennis van muziekartiesten uit alle tijden
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6 px-8 pb-8">
              {/* Info cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">10</div>
                  <div className="text-xs text-muted-foreground">Vragen</div>
                </div>
                <div className="bg-cyan-500/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-600">100</div>
                  <div className="text-xs text-muted-foreground">Max Punten</div>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">141</div>
                  <div className="text-xs text-muted-foreground">Artiesten</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                    Kies je moeilijkheid
                  </label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger className="h-12 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">😊 Makkelijk - Bekende artiesten</SelectItem>
                      <SelectItem value="medium">🎯 Gemiddeld - Mix van genres</SelectItem>
                      <SelectItem value="hard">🔥 Moeilijk - Obscure feiten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                    Kies een genre (optioneel)
                  </label>
                  <Select value={genre || 'all'} onValueChange={(v) => setGenre(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-12 bg-background/50">
                      <SelectValue placeholder="Alle genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎵 Alle genres</SelectItem>
                      <SelectItem value="rock">🎸 Rock</SelectItem>
                      <SelectItem value="pop">🎤 Pop</SelectItem>
                      <SelectItem value="metal">🤘 Metal</SelectItem>
                      <SelectItem value="jazz">🎷 Jazz</SelectItem>
                      <SelectItem value="electronic">🎹 Electronic</SelectItem>
                      <SelectItem value="hip-hop">🎧 Hip-Hop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 h-14 text-lg font-semibold"
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
                    Start de Quiz!
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
