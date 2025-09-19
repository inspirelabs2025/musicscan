import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Trophy, RotateCcw, Timer } from 'lucide-react';

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
  totalAlbums: number;
  totalArtists: number;
  genres: number;
  yearRange: string;
}

export function CollectionQuiz() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && !showExplanation) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, showExplanation]);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('collection-quiz-generator');
      
      if (error) throw error;
      
      if (data.success) {
        setQuiz(data.quiz);
        setCollectionStats(data.collectionStats);
        setCurrentQuestion(0);
        setUserAnswers([]);
        setScore(0);
        setQuizCompleted(false);
        setShowExplanation(false);
        setSelectedAnswer('');
        setTimeLeft(30);
        setTimerActive(true);
        
        toast({
          title: "Quiz Gegenereerd!",
          description: `10 vragen gebaseerd op je ${data.collectionStats.totalAlbums} albums`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Fout bij genereren quiz",
        description: "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleTimeUp = () => {
    if (!selectedAnswer) {
      setSelectedAnswer('TIMEOUT');
    }
    submitAnswer();
  };

  const submitAnswer = () => {
    if (!quiz || showExplanation) return;
    
    setTimerActive(false);
    const currentQ = quiz.questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    setTimerActive(false);
    
    const finalScore = score + (selectedAnswer === quiz!.questions[currentQuestion].correctAnswer ? 1 : 0);
    const percentage = Math.round((finalScore / quiz!.questions.length) * 100);
    
    let level = '';
    if (percentage >= 90) level = '🏆 Collectie Expert';
    else if (percentage >= 75) level = '🎵 Muziekkenner';
    else if (percentage >= 60) level = '📀 Album Liefhebber';
    else level = '🎧 Beginnende Verzamelaar';
    
    toast({
      title: `Quiz Voltooid! ${level}`,
      description: `Je scoorde ${finalScore}/${quiz!.questions.length} (${percentage}%)`,
    });
  };

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setUserAnswers([]);
    setShowExplanation(false);
    setQuizCompleted(false);
    setScore(0);
    setTimerActive(false);
  };

  if (!quiz) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="w-6 h-6" />
            Collectie Knowledge Quiz
          </CardTitle>
          <CardDescription>
            Test je kennis van je eigen muziekcollectie! 
            OpenAI analyseert je volledige collectie en stelt persoonlijke vragen.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {collectionStats && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-2xl font-bold text-primary">{collectionStats.totalAlbums}</div>
                <div className="text-sm text-muted-foreground">Albums</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{collectionStats.totalArtists}</div>
                <div className="text-sm text-muted-foreground">Artiesten</div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={generateQuiz} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Quiz Wordt Gegenereerd...' : 'Start Collectie Quiz'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            ⏱️ Elke vraag heeft een timer van 30 seconden
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const finalScore = userAnswers.filter((answer, index) => 
      answer === quiz.questions[index].correctAnswer
    ).length;
    const percentage = Math.round((finalScore / quiz.questions.length) * 100);

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Quiz Voltooid!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {finalScore}/{quiz.questions.length}
            </div>
            <div className="text-xl">{percentage}% Correct</div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {percentage >= 90 ? '🏆 Collectie Expert' :
               percentage >= 75 ? '🎵 Muziekkenner' :
               percentage >= 60 ? '📀 Album Liefhebber' : '🎧 Beginnende Verzamelaar'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={generateQuiz} variant="default">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nieuwe Quiz
            </Button>
            <Button onClick={resetQuiz} variant="outline">
              Terug naar Start
            </Button>
          </div>

          <div className="text-left space-y-2">
            <h3 className="font-semibold">Jouw Antwoorden:</h3>
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="p-3 border rounded-lg">
                <div className="font-medium">{q.question}</div>
                <div className="mt-1 space-y-1">
                  <div className={`text-sm ${userAnswers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    Jouw antwoord: {userAnswers[index] === 'TIMEOUT' ? '⏰ Tijd verlopen' : userAnswers[index]}
                  </div>
                  {userAnswers[index] !== q.correctAnswer && (
                    <div className="text-sm text-green-600">
                      Correct antwoord: {q.correctAnswer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Vraag {currentQuestion + 1} van {quiz.questions.length}</CardTitle>
            <CardDescription>Score: {score}/{currentQuestion + (showExplanation ? 1 : 0)}</CardDescription>
          </div>
          {timerActive && (
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className={`font-mono ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentQ.question}</div>
        
        <div className="grid gap-3">
          {currentQ.options.map((option, index) => (
            <Button
              key={index}
              variant={
                showExplanation 
                  ? option === currentQ.correctAnswer 
                    ? "default" 
                    : selectedAnswer === option 
                      ? "destructive" 
                      : "outline"
                  : selectedAnswer === option 
                    ? "default" 
                    : "outline"
              }
              className="text-left justify-start h-auto py-3 px-4"
              onClick={() => handleAnswerSelect(option)}
              disabled={showExplanation}
            >
              {option}
            </Button>
          ))}
        </div>

        {showExplanation && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium mb-2">
              {selectedAnswer === currentQ.correctAnswer ? '✅ Correct!' : '❌ Fout'}
            </div>
            <div className="text-sm">{currentQ.explanation}</div>
          </div>
        )}

        <div className="flex justify-between">
          {!showExplanation ? (
            <Button 
              onClick={submitAnswer}
              disabled={!selectedAnswer || selectedAnswer === 'TIMEOUT'}
              className="ml-auto"
            >
              Bevestig Antwoord
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="ml-auto">
              {currentQuestion < quiz.questions.length - 1 ? 'Volgende Vraag' : 'Quiz Voltooien'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}