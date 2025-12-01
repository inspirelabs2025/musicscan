import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';
import { QuizResultShareCard } from '@/components/quiz/QuizResultShareCard';
import { ShareButtons } from '@/components/ShareButtons';
import { Trophy, Play, Loader2, Music, Disc3, Shuffle, Target, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizResultData {
  id: string;
  quiz_type: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  badge_earned: string | null;
  share_token: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const getBadge = (percentage: number) => {
  if (percentage >= 90) return { title: 'Quiz Expert', emoji: '🏆', color: 'bg-yellow-500/20 text-yellow-600' };
  if (percentage >= 75) return { title: 'Muziekkenner', emoji: '🎵', color: 'bg-blue-500/20 text-blue-600' };
  if (percentage >= 60) return { title: 'Goede Score', emoji: '📀', color: 'bg-green-500/20 text-green-600' };
  return { title: 'Blijf Oefenen', emoji: '🎧', color: 'bg-gray-500/20 text-gray-600' };
};

const getQuizTypeLabel = (quizType: string) => {
  switch (quizType) {
    case 'physical_only': return 'Fysieke Collectie';
    case 'spotify_only': return 'Spotify';
    case 'mixed': return 'Mixed';
    default: return 'Muziek';
  }
};

const getQuizTypeIcon = (quizType: string) => {
  switch (quizType) {
    case 'physical_only': return <Disc3 className="w-5 h-5" />;
    case 'spotify_only': return <Music className="w-5 h-5" />;
    case 'mixed': return <Shuffle className="w-5 h-5" />;
    default: return <Target className="w-5 h-5" />;
  }
};

export default function QuizResult() {
  const { shareToken } = useParams<{ shareToken: string }>();
  
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['quiz-result', shareToken],
    queryFn: async (): Promise<QuizResultData | null> => {
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          quiz_type,
          questions_total,
          questions_correct,
          score_percentage,
          badge_earned,
          share_token,
          created_at,
          user_id
        `)
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();
      
      if (error) throw error;
      
      // Fetch profile separately
      if (data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', data.user_id)
          .single();
        
        return { ...data, profiles: profile || undefined };
      }
      
      return data;
    },
    enabled: !!shareToken,
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Quiz Resultaat Niet Gevonden</CardTitle>
              <CardDescription>
                Dit quiz resultaat bestaat niet of is niet meer beschikbaar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/quiz" className="gap-2">
                  <Play className="w-4 h-4" />
                  Start je eigen Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const badge = getBadge(result.score_percentage);
  const shareUrl = `${window.location.origin}/quiz/result/${shareToken}`;
  const displayName = result.profiles?.display_name || 'Een muziekliefhebber';
  
  return (
    <>
      <Helmet>
        <title>{displayName} scoorde {result.score_percentage}% - MusicScan Quiz</title>
        <meta name="description" content={`${displayName} scoorde ${result.score_percentage}% op de MusicScan ${getQuizTypeLabel(result.quiz_type)} Quiz. Kun jij dit verslaan?`} />
        <meta property="og:title" content={`${displayName} scoorde ${result.score_percentage}% - MusicScan Quiz`} />
        <meta property="og:description" content={`${result.questions_correct}/${result.questions_total} vragen correct beantwoord. ${badge.emoji} ${badge.title}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} scoorde ${result.score_percentage}%`} />
        <meta name="twitter:description" content={`MusicScan ${getQuizTypeLabel(result.quiz_type)} Quiz - Kun jij dit verslaan?`} />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold">Quiz Resultaat</h1>
              <p className="text-muted-foreground">
                {displayName} heeft de quiz voltooid!
              </p>
            </div>
            
            {/* Result Card */}
            <QuizResultShareCard
              score={result.questions_correct}
              totalQuestions={result.questions_total}
              percentage={result.score_percentage}
              badge={badge}
              quizType={result.quiz_type}
              username={result.profiles?.display_name || undefined}
              avatarUrl={result.profiles?.avatar_url || undefined}
            />
            
            {/* Share Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Deel dit resultaat</CardTitle>
              </CardHeader>
              <CardContent>
                <ShareButtons 
                  url={shareUrl}
                  title={`${displayName} scoorde ${result.score_percentage}% op de MusicScan Quiz!`}
                  description={`${result.questions_correct}/${result.questions_total} correct - ${badge.emoji} ${badge.title}`}
                />
              </CardContent>
            </Card>
            
            {/* CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center space-y-4">
                <h2 className="text-xl font-semibold">Kun jij dit verslaan? 🎯</h2>
                <p className="text-muted-foreground">
                  Test je eigen muziekkennis met de MusicScan Quiz!
                </p>
                <Button asChild size="lg" className="gap-2">
                  <Link to="/quiz">
                    <Play className="w-5 h-5" />
                    Start de Quiz
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Quiz Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {getQuizTypeIcon(result.quiz_type)}
                {getQuizTypeLabel(result.quiz_type)} Quiz
              </div>
              <span>•</span>
              <span>{result.questions_total} vragen</span>
              <span>•</span>
              <span>{new Date(result.created_at).toLocaleDateString('nl-NL')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
