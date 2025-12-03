import React, { useState } from 'react';
import { Album, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';

interface Question {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  albumImage?: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

export function AlbumQuiz() {
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [decade, setDecade] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-album-quiz', {
        body: { difficulty, decade: decade || undefined, questionCount: 10 }
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

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/quizzen" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Terug naar Quiz Hub
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Album className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Album Quiz</CardTitle>
            <p className="text-muted-foreground">Hoeveel weet je van muziekalbums?</p>
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
                <label className="text-sm font-medium mb-2 block">Decennium (optioneel)</label>
                <Select value={decade || 'all'} onValueChange={(v) => setDecade(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle decennia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle decennia</SelectItem>
                    <SelectItem value="1960">Jaren 60</SelectItem>
                    <SelectItem value="1970">Jaren 70</SelectItem>
                    <SelectItem value="1980">Jaren 80</SelectItem>
                    <SelectItem value="1990">Jaren 90</SelectItem>
                    <SelectItem value="2000">Jaren 2000</SelectItem>
                    <SelectItem value="2010">Jaren 2010</SelectItem>
                    <SelectItem value="2020">Jaren 2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">10 vragen</Badge>
              <Badge variant="secondary">Unieke vragen</Badge>
              <Badge variant="secondary">+10 punten per vraag</Badge>
            </div>

            <Button 
              onClick={startQuiz} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
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

  if (showResults) {
    const score = calculateScore();
    return (
      <QuizResults 
        score={score}
        totalQuestions={questions.length}
        quizType="albums"
        onPlayAgain={resetQuiz}
        answers={answers}
        questions={questions}
      />
    );
  }

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
