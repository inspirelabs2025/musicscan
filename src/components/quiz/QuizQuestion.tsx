import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  artistImage?: string;
  albumImage?: string;
}

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  onAnswer: (answer: string) => void;
  showResult: boolean;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  showResult,
}: QuizQuestionProps) {
  const progress = (questionNumber / totalQuestions) * 100;
  const isCorrect = selectedAnswer === question.correctAnswer;
  const imageUrl = question.artistImage || question.albumImage;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Vraag {questionNumber} van {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="overflow-hidden">
        {/* Image if available */}
        {imageUrl && (
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
            <img 
              src={imageUrl} 
              alt="Quiz" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <CardContent className="p-6">
          {/* Question */}
          <h2 className="text-xl font-semibold mb-6">{question.question}</h2>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correctAnswer;
              
              let buttonClass = 'justify-start h-auto py-4 px-4 text-left';
              
              if (showResult) {
                if (isCorrectOption) {
                  buttonClass += ' bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
                } else if (isSelected && !isCorrectOption) {
                  buttonClass += ' bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
                }
              } else if (isSelected) {
                buttonClass += ' border-primary bg-primary/10';
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(buttonClass, 'relative')}
                  onClick={() => !showResult && onAnswer(option)}
                  disabled={showResult}
                >
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrectOption && (
                    <Check className="w-5 h-5 text-green-500 ml-2" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <X className="w-5 h-5 text-red-500 ml-2" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Explanation after answering */}
          {showResult && (
            <div className={cn(
              'mt-6 p-4 rounded-lg',
              isCorrect 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-700 dark:text-green-300">Correct! +10 punten</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700 dark:text-red-300">Helaas fout</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
