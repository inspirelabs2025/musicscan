import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Target, Music, Disc3, Shuffle } from 'lucide-react';

interface QuizResultShareCardProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  badge: { title: string; emoji: string; color: string };
  quizType: string;
  username?: string;
  avatarUrl?: string;
  className?: string;
}

export function QuizResultShareCard({
  score,
  totalQuestions,
  percentage,
  badge,
  quizType,
  username,
  avatarUrl,
  className
}: QuizResultShareCardProps) {
  const getQuizTypeIcon = () => {
    switch (quizType) {
      case 'physical_only': return <Disc3 className="w-6 h-6" />;
      case 'spotify_only': return <Music className="w-6 h-6" />;
      case 'mixed': return <Shuffle className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };
  
  const getQuizTypeLabel = () => {
    switch (quizType) {
      case 'physical_only': return 'Fysieke Collectie';
      case 'spotify_only': return 'Spotify';
      case 'mixed': return 'Mixed';
      default: return 'Auto';
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getQuizTypeIcon()}
            <span className="font-medium">{getQuizTypeLabel()} Quiz</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Trophy className="w-4 h-4" />
            MusicScan
          </div>
        </div>
        
        {username && (
          <div className="flex items-center gap-3 mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium">{username}</span>
          </div>
        )}
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="text-center"
        >
          <div className="text-6xl font-bold mb-2">{percentage}%</div>
          <div className="text-lg opacity-90">{score} van {totalQuestions} correct</div>
        </motion.div>
      </div>
      
      <CardContent className="p-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center"
        >
          <Badge variant="secondary" className={`text-lg px-4 py-2 ${badge.color}`}>
            <span className="text-xl mr-2">{badge.emoji}</span>
            {badge.title}
          </Badge>
        </motion.div>
        
        <p className="text-center text-muted-foreground mt-4 text-sm">
          Kun jij dit verslaan? Doe de quiz op www.musicscan.app/quiz
        </p>
      </CardContent>
    </Card>
  );
}
