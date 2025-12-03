import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw } from 'lucide-react';
import { DANCE_HOUSE_QUIZ_QUESTIONS } from '@/hooks/useDanceHouseMuziek';

export const DanceHouseMuziekQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = DANCE_HOUSE_QUIZ_QUESTIONS[currentQuestion];

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === question.correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < DANCE_HOUSE_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = Math.round((score / DANCE_HOUSE_QUIZ_QUESTIONS.length) * 100);
    return (
      <section className="py-16 bg-gradient-to-br from-cyan-950/50 to-purple-950/50">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-background/80 backdrop-blur border-cyan-500/20">
            <CardContent className="pt-8 text-center">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? '🎧' : percentage >= 50 ? '🎵' : '💿'}
              </div>
              <h3 className="text-2xl font-bold mb-2">Quiz Voltooid!</h3>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
                {score}/{DANCE_HOUSE_QUIZ_QUESTIONS.length} correct
              </p>
              <p className="text-muted-foreground mb-6">
                {percentage >= 80 
                  ? 'Wow! Je bent een echte dance muziek kenner!' 
                  : percentage >= 50 
                    ? 'Goed gedaan! Je kent je classics.' 
                    : 'Tijd om meer te ontdekken over dance muziek!'}
              </p>
              <Button onClick={resetQuiz} className="bg-gradient-to-r from-cyan-500 to-purple-500">
                <RotateCcw className="w-4 h-4 mr-2" />
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-cyan-950/50 to-purple-950/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm">Dance/House Quiz</span>
          </div>
          <h2 className="text-3xl font-bold">Test je Dance Kennis</h2>
          <p className="text-muted-foreground mt-2">
            Vraag {currentQuestion + 1} van {DANCE_HOUSE_QUIZ_QUESTIONS.length}
          </p>
        </div>

        <Card className="max-w-2xl mx-auto bg-background/80 backdrop-blur border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  showResult
                    ? index === question.correct
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : index === selectedAnswer
                        ? 'bg-red-500/20 border-2 border-red-500'
                        : 'bg-muted/50 border border-transparent'
                    : 'bg-muted/50 hover:bg-muted border border-transparent hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && index === question.correct && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && index === selectedAnswer && index !== question.correct && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}

            {showResult && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
                <Button onClick={nextQuestion} className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-500">
                  {currentQuestion < DANCE_HOUSE_QUIZ_QUESTIONS.length - 1 ? 'Volgende vraag' : 'Bekijk resultaat'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
