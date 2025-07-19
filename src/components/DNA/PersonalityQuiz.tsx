
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trophy, Brain } from "lucide-react";

interface PersonalityQuizProps {
  analysis: any;
  chartData: any;
  onClose: () => void;
}

export function PersonalityQuiz({ analysis, chartData, onClose }: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      question: "What's your most represented genre?",
      options: chartData.genreDistribution?.slice(0, 4).map((g: any) => g.name) || ['Rock', 'Pop', 'Jazz', 'Electronic'],
      correct: chartData.genreDistribution?.[0]?.name || 'Rock'
    },
    {
      question: "How many different genres do you have?",
      options: ['1-5', '6-10', '11-15', '16+'],
      correct: chartData.genreDistribution?.length > 15 ? '16+' : 
               chartData.genreDistribution?.length > 10 ? '11-15' :
               chartData.genreDistribution?.length > 5 ? '6-10' : '1-5'
    },
    {
      question: "What's your collection personality trait?",
      options: analysis.musicPersonality.traits.slice(0, 4),
      correct: analysis.musicPersonality.traits[0]
    },
    {
      question: "What should be your next purchase?",
      options: analysis.recommendations.nextPurchases.slice(0, 4),
      correct: analysis.recommendations.nextPurchases[0]
    }
  ];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const correctAnswers = answers.filter((answer, index) => 
    answer === questions[index].correct
  ).length;

  const getPersonalityResult = () => {
    if (correctAnswers === 4) return "🎯 Perfect Music DNA Match!";
    if (correctAnswers === 3) return "🎵 Music Expert";
    if (correctAnswers === 2) return "🎶 Music Enthusiast";
    return "🎼 Music Explorer";
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-900 to-purple-900 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Quiz Results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">{getPersonalityResult()}</div>
              <p className="text-xl text-white">
                You got {correctAnswers} out of {questions.length} correct!
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Your Results</h3>
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">{q.question}</span>
                      <Badge 
                        className={
                          answers[index] === q.correct 
                            ? "bg-green-500/20 text-green-200 border-green-500/30" 
                            : "bg-red-500/20 text-red-200 border-red-500/30"
                        }
                      >
                        {answers[index] === q.correct ? '✓' : '✗'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
                <p className="text-white/80">
                  {correctAnswers >= 3 
                    ? "You know your collection inside and out! Your musical DNA is perfectly aligned."
                    : "There's still more to discover about your musical journey. Keep exploring!"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-900 to-purple-900 border-purple-500/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            Music DNA Quiz
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-white/70">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
            </div>
            
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">
              {questions[currentQuestion].question}
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="text-left p-4 h-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  variant="outline"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
