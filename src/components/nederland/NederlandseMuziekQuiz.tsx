import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Music, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  funFact: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    question: "In welk jaar scoorde Golden Earring een hit met 'Radar Love'?",
    options: ["1970", "1973", "1976", "1980"],
    correctAnswer: 1,
    funFact: "Radar Love werd een wereldwijde hit en staat nog steeds in de top 100 beste rocknummers aller tijden!"
  },
  {
    question: "Welke Nederlandse DJ werd in 2002 uitgeroepen tot 's werelds beste DJ?",
    options: ["Armin van Buuren", "Tiësto", "Afrojack", "Hardwell"],
    correctAnswer: 1,
    funFact: "Tiësto was de eerste DJ die solo optrad tijdens de Olympische Spelen (Athene 2004)."
  },
  {
    question: "Shocking Blue scoorde een #1 hit in Amerika met welk nummer?",
    options: ["Love Buzz", "Venus", "Send Me a Postcard", "Long and Lonesome Road"],
    correctAnswer: 1,
    funFact: "Venus was de eerste Nederlandse song die #1 werd in de Amerikaanse Billboard Hot 100!"
  },
  {
    question: "Welke Nederlandse band bracht symphonic metal naar de mainstream?",
    options: ["Epica", "Within Temptation", "After Forever", "Delain"],
    correctAnswer: 1,
    funFact: "Within Temptation werd opgericht in 1996 en hun album 'The Silent Force' ging platina."
  },
  {
    question: "Hoeveel keer werd Martin Garrix uitgeroepen tot werelds beste DJ?",
    options: ["1 keer", "2 keer", "3 keer", "4 keer"],
    correctAnswer: 2,
    funFact: "Martin Garrix was pas 17 toen hij zijn eerste #1 hit 'Animals' uitbracht!"
  },
  {
    question: "Welke Nederlandse zanger werd 'de Kleine Grote Man' genoemd?",
    options: ["Marco Borsato", "André Hazes", "Frans Bauer", "Lee Towers"],
    correctAnswer: 1,
    funFact: "André Hazes verkocht meer dan 10 miljoen albums in Nederland alleen."
  },
  {
    question: "De band Focus had een instrumentale wereldhit. Welk nummer was dat?",
    options: ["Sylvia", "Hocus Pocus", "House of the King", "Eruption"],
    correctAnswer: 1,
    funFact: "Hocus Pocus bevat het beroemde jodelen van zanger Thijs van Leer!"
  },
  {
    question: "Welke Nederlandse artiest vertegenwoordigde Nederland op Eurovision 2022?",
    options: ["Duncan Laurence", "S10", "Douwe Bob", "Waylon"],
    correctAnswer: 1,
    funFact: "S10 zong 'De Diepte' - het eerste Nederlandstalige nummer op Eurovision in decennia."
  },
  {
    question: "Welke Nederlandse band scoorde een hit met 'Pa'?",
    options: ["BZN", "Doe Maar", "Het Goede Doel", "De Dijk"],
    correctAnswer: 1,
    funFact: "Doe Maar was een van de eerste Nederlandse bands die Nederlands zongen en toch massaal populair werden."
  },
  {
    question: "Welke Nederlandse rockzangeres brak internationaal door met 'Nobody's Wife'?",
    options: ["Sharon den Adel", "Anouk", "Floor Jansen", "Caro Emerald"],
    correctAnswer: 1,
    funFact: "Anouk was de eerste Nederlandse vrouwelijke rockartiest die internationaal succes had."
  }
];

const getBadge = (score: number, total: number) => {
  const percentage = (score / total) * 100;
  if (percentage >= 80) return { title: "Nederlandse Muziek Expert", emoji: "🏆", color: "text-yellow-500" };
  if (percentage >= 60) return { title: "Muziek Kenner", emoji: "⭐", color: "text-blue-500" };
  if (percentage >= 40) return { title: "Enthousiaste Luisteraar", emoji: "🎵", color: "text-green-500" };
  return { title: "Beginnende Fan", emoji: "🎧", color: "text-purple-500" };
};

export const NederlandseMuziekQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [started, setStarted] = useState(false);

  const questions = QUIZ_QUESTIONS; // All 10 questions
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizComplete(false);
    setStarted(false);
  };

  const badge = getBadge(score, questions.length);

  if (!started) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border-orange-500/20">
              <CardContent className="p-8 space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Music className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold">🇳🇱 Nederlandse Muziek Quiz</h2>
                <p className="text-muted-foreground text-lg">
                  Test je kennis over Nederlandse muziekgeschiedenis! Van Golden Earring tot Martin Garrix.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    10 vragen
                  </span>
                  <span>•</span>
                  <span>3-5 minuten</span>
                </div>
                <Button 
                  onClick={() => setStarted(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg"
                >
                  Start de Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  if (quizComplete) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border-orange-500/20">
              <CardContent className="p-8 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-bold">Quiz Voltooid!</h2>
                
                <div className="text-6xl font-bold">
                  {score}/{questions.length}
                </div>
                
                <div className={`text-2xl font-semibold ${badge.color}`}>
                  {badge.emoji} {badge.title}
                </div>
                
                <div className="flex justify-center gap-1">
                  {Array.from({ length: questions.length }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-8 h-8 ${i < score ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                    />
                  ))}
                </div>
                
                <p className="text-muted-foreground">
                  {score === questions.length 
                    ? "Perfecte score! Je bent een echte Nederlandse muziek expert!"
                    : score >= 7 
                    ? "Uitstekend! Je kent je Nederlandse muziek!"
                    : score >= 5
                    ? "Goed gedaan! Je kent aardig wat Nederlandse muziek!"
                    : "Blijf luisteren en ontdek meer Nederlandse muziek!"}
                </p>
                
                <Button 
                  onClick={resetQuiz}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Opnieuw Spelen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border-orange-500/20 overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Vraag {currentQuestion + 1} van {questions.length}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {score} punten
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold">
                    {questions[currentQuestion].question}
                  </h3>

                  <div className="grid gap-3">
                    {questions[currentQuestion].options.map((option, index) => {
                      const isCorrect = index === questions[currentQuestion].correctAnswer;
                      const isSelected = selectedAnswer === index;
                      
                      let buttonClass = "w-full justify-start text-left h-auto py-4 px-4 ";
                      if (showResult) {
                        if (isCorrect) {
                          buttonClass += "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                        }
                      }

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => handleAnswer(index)}
                            disabled={showResult}
                          >
                            <span className="flex items-center gap-3 w-full">
                              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {showResult && isCorrect && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {showResult && isSelected && !isCorrect && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </span>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Fun Fact */}
                  <AnimatePresence>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-muted/50 rounded-lg p-4"
                      >
                        <p className="text-sm">
                          <span className="font-semibold">💡 Wist je dat: </span>
                          {questions[currentQuestion].funFact}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>

              {/* Next Button */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <Button 
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {currentQuestion < questions.length - 1 ? "Volgende Vraag" : "Bekijk Resultaat"}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};