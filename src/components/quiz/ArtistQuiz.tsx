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
      <div className="max-w-2xl mx-auto">
        <Link to="/quizzen" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Terug naar Quiz Hub
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Artiesten Quiz</CardTitle>
            <p className="text-muted-foreground">Test je kennis van muziekartiesten</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Moeilijkheid</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">😊 Makkelijk</SelectItem>
                    <SelectItem value="medium">🎯 Gemiddeld</SelectItem>
                    <SelectItem value="hard">🔥 Moeilijk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Genre (optioneel)</label>
                <Select value={genre || 'all'} onValueChange={(v) => setGenre(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle genres</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">10 vragen</Badge>
              <Badge variant="secondary">AI-gegenereerd</Badge>
              <Badge variant="secondary">+10 punten per vraag</Badge>
            </div>

            <Button 
              onClick={startQuiz} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Quiz laden...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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
