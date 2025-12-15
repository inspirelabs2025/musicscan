import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Gift, RotateCcw, Share2, Trophy, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const CHRISTMAS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Welk nummer van Mariah Carey staat bekend als het best verkochte kerstnummer aller tijden?",
    options: ["Christmas (Baby Please Come Home)", "All I Want for Christmas Is You", "Santa Claus Is Coming to Town", "O Holy Night"],
    correctAnswer: 1,
    explanation: "'All I Want for Christmas Is You' (1994) is het best verkochte kerstnummer ooit met meer dan 16 miljoen verkochte exemplaren."
  },
  {
    question: "In welk jaar bracht Wham! 'Last Christmas' uit?",
    options: ["1982", "1984", "1986", "1988"],
    correctAnswer: 1,
    explanation: "'Last Christmas' werd uitgebracht in 1984 en is nog steeds een van de populairste kerstnummers ter wereld."
  },
  {
    question: "Welke artiest zong het originele 'White Christmas'?",
    options: ["Frank Sinatra", "Elvis Presley", "Bing Crosby", "Nat King Cole"],
    correctAnswer: 2,
    explanation: "Bing Crosby nam 'White Christmas' op in 1942. Het is het best verkochte singlenummer aller tijden."
  },
  {
    question: "Wie schreef en zong 'Driving Home for Christmas'?",
    options: ["George Michael", "Chris Rea", "Elton John", "Phil Collins"],
    correctAnswer: 1,
    explanation: "Chris Rea schreef dit nummer in 1986 terwijl hij in een file stond op weg naar huis voor kerst."
  },
  {
    question: "Welke band scoorde een hit met 'Do They Know It's Christmas?'?",
    options: ["Queen", "Band Aid", "The Pogues", "Slade"],
    correctAnswer: 1,
    explanation: "Band Aid, een supergroep samengesteld door Bob Geldof, bracht dit liefdadigheidsnummer uit in 1984."
  },
  {
    question: "Hoeveel weken stond 'All I Want for Christmas Is You' op #1 in de VS?",
    options: ["4 weken", "8 weken", "12 weken", "16 weken"],
    correctAnswer: 2,
    explanation: "Het nummer bereikte pas in 2019 voor het eerst #1 en stond inmiddels meer dan 12 weken op die positie."
  },
  {
    question: "Welk Nederlands kerstnummer werd een grote hit in 1974?",
    options: ["Flappie - Youp van 't Hek", "Kerstmis voor Mij - Maan", "Aan de Amsterdamse Grachten - Willy Alberti", "Wonderful Christmastime - Paul McCartney"],
    correctAnswer: 2,
    explanation: "'Aan de Amsterdamse Grachten' van Willy Alberti werd in 1974 een grote kersthit."
  },
  {
    question: "Wie zingt 'Fairytale of New York' samen met The Pogues?",
    options: ["Sinead O'Connor", "Kate Bush", "Kirsty MacColl", "Enya"],
    correctAnswer: 2,
    explanation: "Kirsty MacColl zong het duet met Shane MacGowan van The Pogues in 1987."
  },
  {
    question: "Welke artiest bracht 'Christmas' (ook bekend als 'Baby Please Come Home') uit in 1963?",
    options: ["Darlene Love", "Diana Ross", "Aretha Franklin", "Tina Turner"],
    correctAnswer: 0,
    explanation: "Darlene Love nam dit nummer op voor het legendarische 'A Christmas Gift for You from Phil Spector' album."
  },
  {
    question: "Welk kerstnummer van Michael Bublé werd zijn grootste hit?",
    options: ["Santa Claus Is Coming to Town", "It's Beginning to Look a Lot Like Christmas", "Holly Jolly Christmas", "Have Yourself a Merry Little Christmas"],
    correctAnswer: 1,
    explanation: "'It's Beginning to Look a Lot Like Christmas' is Michael Bublé's meest gestreamde kerstnummer."
  }
];

export const ChristmasQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === CHRISTMAS_QUIZ_QUESTIONS[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < CHRISTMAS_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      if (user) {
        saveQuizResult();
      }
    }
  };

  const saveQuizResult = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const percentage = Math.round((score / CHRISTMAS_QUIZ_QUESTIONS.length) * 100);
      
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        quiz_type: 'christmas',
        questions_total: CHRISTMAS_QUIZ_QUESTIONS.length,
        questions_correct: score,
        score_percentage: percentage,
        badge_earned: getBadge(percentage).title,
        is_public: true
      });

      // Update leaderboard
      const { data: existing } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await supabase.from('quiz_leaderboard').update({
          total_quizzes: existing.total_quizzes + 1,
          total_correct: existing.total_correct + score,
          total_questions: existing.total_questions + CHRISTMAS_QUIZ_QUESTIONS.length,
          total_points: existing.total_points + (score * 10) + (percentage === 100 ? 50 : 0),
          best_score: Math.max(existing.best_score, percentage),
          average_score: Math.round(((existing.average_score * existing.total_quizzes) + percentage) / (existing.total_quizzes + 1))
        }).eq('user_id', user.id);
      } else {
        await supabase.from('quiz_leaderboard').insert({
          user_id: user.id,
          total_quizzes: 1,
          total_correct: score,
          total_questions: CHRISTMAS_QUIZ_QUESTIONS.length,
          total_points: (score * 10) + (percentage === 100 ? 50 : 0),
          best_score: percentage,
          average_score: percentage
        });
      }

      toast({
        title: "🎄 Score opgeslagen!",
        description: `Je hebt ${score * 10}${percentage === 100 ? ' + 50 bonus' : ''} punten verdiend!`
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getBadge = (percentage: number) => {
    if (percentage === 100) return { title: 'Kerst Expert', emoji: '🎄', color: 'text-green-500' };
    if (percentage >= 80) return { title: 'Kerst Kenner', emoji: '⭐', color: 'text-yellow-500' };
    if (percentage >= 60) return { title: 'Kerst Fan', emoji: '🎁', color: 'text-red-500' };
    return { title: 'Kerst Beginner', emoji: '❄️', color: 'text-blue-500' };
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  };

  const shareResult = async () => {
    const percentage = Math.round((score / CHRISTMAS_QUIZ_QUESTIONS.length) * 100);
    const badge = getBadge(percentage);
    const shareText = `🎄 Ik scoorde ${score}/${CHRISTMAS_QUIZ_QUESTIONS.length} (${percentage}%) in de MusicScan Kerst Quiz! ${badge.emoji} ${badge.title}\n\nTest jouw kerstmuziek kennis:`;
    const shareUrl = `${window.location.origin}/kerst`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MusicScan Kerst Quiz',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "Link gekopieerd!",
        description: "Deel je score met vrienden"
      });
    }
  };

  const question = CHRISTMAS_QUIZ_QUESTIONS[currentQuestion];
  const percentage = Math.round((score / CHRISTMAS_QUIZ_QUESTIONS.length) * 100);
  const badge = getBadge(percentage);

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Festive background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-green-950/20 to-red-950/30"></div>
      <div className="absolute top-10 left-10 text-4xl opacity-20 animate-pulse">❄️</div>
      <div className="absolute top-20 right-20 text-3xl opacity-20 animate-pulse delay-100">🎄</div>
      <div className="absolute bottom-10 left-1/4 text-4xl opacity-20 animate-pulse delay-200">🎁</div>
      <div className="absolute bottom-20 right-1/3 text-3xl opacity-20 animate-pulse delay-300">⭐</div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">Verdien Punten!</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            🎄 Kerst Muziek Quiz
          </h2>
          <p className="text-muted-foreground text-lg">
            Test je kennis van de beste kerstmuziek aller tijden!
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-red-500/30 bg-card/80 backdrop-blur-sm shadow-2xl shadow-red-500/10">
          <CardHeader className="bg-gradient-to-r from-red-500/20 via-green-500/10 to-red-500/20 border-b border-red-500/20">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-red-500" />
                <span className="text-lg">Kerst Muziek Quiz</span>
              </span>
              {!quizComplete && (
                <span className="text-sm font-normal text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                  Vraag {currentQuestion + 1}/{CHRISTMAS_QUIZ_QUESTIONS.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {quizComplete ? (
              <div className="text-center py-8">
                {/* Score display */}
                <div className="relative mb-6">
                  <div className="text-7xl mb-2">{badge.emoji}</div>
                  <div className="absolute -top-2 -right-2 text-4xl animate-bounce">✨</div>
                </div>
                
                <h3 className={cn("text-3xl font-bold mb-2", badge.color)}>
                  {badge.title}
                </h3>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="bg-green-500/20 rounded-xl px-4 py-2 border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">{score}/{CHRISTMAS_QUIZ_QUESTIONS.length}</div>
                    <div className="text-xs text-green-300">Correct</div>
                  </div>
                  <div className="bg-yellow-500/20 rounded-xl px-4 py-2 border border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">{percentage}%</div>
                    <div className="text-xs text-yellow-300">Score</div>
                  </div>
                  <div className="bg-purple-500/20 rounded-xl px-4 py-2 border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">+{score * 10}{percentage === 100 ? '+50' : ''}</div>
                    <div className="text-xs text-purple-300">Punten</div>
                  </div>
                </div>

                {!user && (
                  <p className="text-sm text-muted-foreground mb-6 bg-muted/50 rounded-lg p-3">
                    💡 Log in om je score op te slaan en punten te verdienen!
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={resetQuiz} 
                    variant="outline"
                    className="gap-2 border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Opnieuw Spelen
                  </Button>
                  <Button 
                    onClick={shareResult}
                    className="gap-2 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
                  >
                    <Share2 className="h-4 w-4" />
                    Deel Je Score
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-500"
                    style={{ width: `${((currentQuestion) / CHRISTMAS_QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <p className="text-lg font-medium mb-6 leading-relaxed">{question.question}</p>
                
                <div className="space-y-3 mb-6">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                        selectedAnswer === null && "hover:bg-red-500/10 hover:border-red-500/50 hover:scale-[1.02]",
                        selectedAnswer === index && index === question.correctAnswer && "bg-green-500/20 border-green-500 scale-[1.02]",
                        selectedAnswer === index && index !== question.correctAnswer && "bg-red-500/20 border-red-500",
                        selectedAnswer !== null && index === question.correctAnswer && selectedAnswer !== index && "bg-green-500/10 border-green-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
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
                  <div className="bg-muted/50 rounded-xl p-4 mb-4 border border-border/50">
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                )}

                {showResult && (
                  <Button 
                    onClick={nextQuestion} 
                    className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-semibold py-6"
                  >
                    {currentQuestion < CHRISTMAS_QUIZ_QUESTIONS.length - 1 ? "Volgende Vraag →" : "🎄 Bekijk Resultaat"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats hint */}
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            🏆 Speel quizzen om punten te verdienen en op het leaderboard te komen!
          </p>
        </div>
      </div>
    </section>
  );
};
