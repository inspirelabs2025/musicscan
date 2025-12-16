import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FILMMUZIEK_QUIZ_QUESTIONS } from '@/hooks/useFilmmuziek';

export const FilmmuziekQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  const questions = FILMMUZIEK_QUIZ_QUESTIONS.slice(0, 5); // Show 5 questions
  const question = questions[currentQuestion];

  const handleAnswer = (index: number) => {
    if (answered) return;
    
    setSelectedAnswer(index);
    setAnswered(true);
    
    if (index === question.correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setAnswered(false);
  };

  if (showResult) {
    return (
      <section className="py-16 bg-gradient-to-br from-amber-900/20 to-slate-900/40">
        <div className="container mx-auto px-4">
          <Card className="max-w-xl mx-auto bg-card/80 backdrop-blur border-amber-500/20">
            <CardHeader className="text-center">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">Quiz Voltooid!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-amber-400 mb-4">{score}/{questions.length}</p>
              <p className="text-muted-foreground mb-6">
                {score === questions.length ? "Perfect! Je bent een echte filmmuziek expert! 🎬" :
                 score >= 3 ? "Goed gedaan! Je kent je filmmuziek klassiekers! 🎵" :
                 "Blijf luisteren en leren! Elke score vertelt een verhaal 🎼"}
              </p>
              <Button onClick={resetQuiz} className="bg-amber-600 hover:bg-amber-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Opnieuw Proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-amber-900/20 to-slate-900/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Test Je Kennis</span>
          </div>
          <h2 className="text-3xl font-bold">Filmmuziek Quiz</h2>
          <p className="text-muted-foreground mt-2">Hoe goed ken jij de wereld van soundtracks?</p>
        </div>

        <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur border-amber-500/20">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Vraag {currentQuestion + 1}/{questions.length}</span>
              <span className="text-sm text-amber-400">Score: {score}</span>
            </div>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered}
                className={`w-full p-4 rounded-lg text-left transition-all flex items-center justify-between ${
                  answered
                    ? index === question.correct
                      ? 'bg-green-500/20 border-green-500 border'
                      : index === selectedAnswer
                      ? 'bg-red-500/20 border-red-500 border'
                      : 'bg-muted/50'
                    : 'bg-muted/50 hover:bg-amber-500/20 hover:border-amber-500/50 border border-transparent'
                }`}
              >
                <span>{option}</span>
                {answered && index === question.correct && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {answered && index === selectedAnswer && index !== question.correct && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </button>
            ))}

            {answered && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg">
                <p className="text-sm text-amber-200">{question.explanation}</p>
              </div>
            )}

            {answered && (
              <Button onClick={nextQuestion} className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                {currentQuestion < questions.length - 1 ? 'Volgende Vraag' : 'Bekijk Resultaat'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
