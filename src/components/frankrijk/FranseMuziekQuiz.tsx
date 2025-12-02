import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, HelpCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Welk Frans duo won 4 Grammy Awards in 2014, waaronder Album en Record of the Year?",
    options: ["Air", "Justice", "Daft Punk", "Cassius"],
    correctAnswer: 2,
    explanation: "Daft Punk won 4 Grammy's voor 'Random Access Memories' en de hit 'Get Lucky'."
  },
  {
    question: "Wie zong het iconische chanson 'La Vie en Rose'?",
    options: ["Dalida", "Édith Piaf", "Mireille Mathieu", "Barbara"],
    correctAnswer: 1,
    explanation: "Édith Piaf nam 'La Vie en Rose' op in 1946, het werd haar handtekening nummer."
  },
  {
    question: "Welke Franse DJ werd bekend als 's werelds best verdienende DJ?",
    options: ["Martin Solveig", "Bob Sinclar", "David Guetta", "Laurent Garnier"],
    correctAnswer: 2,
    explanation: "David Guetta stond jarenlang in de top van best verdienende DJ's ter wereld."
  },
  {
    question: "Welk controversieel nummer uit 1969 werd in meerdere landen verboden?",
    options: ["La Mer", "Je t'aime... moi non plus", "Comme d'habitude", "Non, je ne regrette rien"],
    correctAnswer: 1,
    explanation: "'Je t'aime... moi non plus' van Serge Gainsbourg en Jane Birkin werd verboden vanwege de expliciete inhoud."
  },
  {
    question: "Welke Franse band uit Versailles won een Grammy voor 'Best Alternative Music Album'?",
    options: ["Air", "Phoenix", "M83", "Indochine"],
    correctAnswer: 1,
    explanation: "Phoenix won de Grammy in 2010 voor 'Wolfgang Amadeus Phoenix'."
  },
  {
    question: "Wie wordt de 'French Elvis' genoemd?",
    options: ["Claude François", "Michel Sardou", "Johnny Hallyday", "Serge Gainsbourg"],
    correctAnswer: 2,
    explanation: "Johnny Hallyday bracht rock 'n roll naar Frankrijk en werd de 'French Elvis' genoemd."
  },
  {
    question: "Welke Franse metalband trad op bij de openingsceremonie van de Olympische Spelen in Parijs 2024?",
    options: ["Alcest", "Gojira", "Magma", "Trust"],
    correctAnswer: 1,
    explanation: "Gojira speelde een spectaculaire performance bij de opening van de Olympische Spelen."
  },
  {
    question: "Welk nummer van Aya Nakamura werd het meest gestreamde Franstalige nummer ooit?",
    options: ["Pookie", "Djadja", "Copines", "Doudou"],
    correctAnswer: 1,
    explanation: "'Djadja' brak alle records en maakte Aya Nakamura tot de meest gestreamde Franstalige artiest."
  }
];

export const FranseMuziekQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
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

  const question = quizQuestions[currentQuestion];

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            🇫🇷 Test Je Kennis
          </h2>
          <p className="text-muted-foreground">
            Hoeveel weet jij over Franse muziekgeschiedenis?
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-[#0055A4]/20">
          <CardHeader className="bg-gradient-to-r from-[#0055A4]/10 via-transparent to-[#EF4135]/10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#0055A4]" />
                Franse Muziek Quiz
              </span>
              {!quizComplete && (
                <span className="text-sm font-normal text-muted-foreground">
                  Vraag {currentQuestion + 1}/{quizQuestions.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {quizComplete ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">
                  {score >= 7 ? "🏆" : score >= 5 ? "🎉" : score >= 3 ? "👍" : "📚"}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {score >= 7 ? "Fantastique!" : score >= 5 ? "Très bien!" : score >= 3 ? "Pas mal!" : "Continuez!"}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Je hebt {score} van de {quizQuestions.length} vragen goed beantwoord
                </p>
                <Button onClick={resetQuiz} className="gap-2 bg-[#0055A4] hover:bg-[#0055A4]/80">
                  <RotateCcw className="h-4 w-4" />
                  Opnieuw Spelen
                </Button>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium mb-6">{question.question}</p>
                
                <div className="space-y-3 mb-6">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all",
                        selectedAnswer === null && "hover:bg-muted hover:border-[#0055A4]/50",
                        selectedAnswer === index && index === question.correctAnswer && "bg-green-500/20 border-green-500",
                        selectedAnswer === index && index !== question.correctAnswer && "bg-red-500/20 border-red-500",
                        selectedAnswer !== null && index === question.correctAnswer && selectedAnswer !== index && "bg-green-500/10 border-green-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && index === question.correctAnswer && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {showResult && selectedAnswer === index && index !== question.correctAnswer && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {showResult && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                )}

                {showResult && (
                  <Button onClick={nextQuestion} className="w-full bg-[#0055A4] hover:bg-[#0055A4]/80">
                    {currentQuestion < quizQuestions.length - 1 ? "Volgende Vraag" : "Bekijk Resultaat"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
