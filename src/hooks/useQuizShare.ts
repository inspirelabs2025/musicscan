import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizShareData {
  score: number;
  totalQuestions: number;
  percentage: number;
  quizType: string;
  badge: { title: string; emoji: string; color: string };
}

interface SavedQuizResult {
  id: string;
  shareToken: string;
  shareImageUrl?: string;
}

export function useQuizShare() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const generateShareToken = (): string => {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  };

  const getBadge = (percentage: number) => {
    if (percentage >= 90) return { title: 'Quiz Expert', emoji: '🏆', color: 'bg-yellow-500/20 text-yellow-600' };
    if (percentage >= 75) return { title: 'Muziekkenner', emoji: '🎵', color: 'bg-blue-500/20 text-blue-600' };
    if (percentage >= 60) return { title: 'Goede Score', emoji: '📀', color: 'bg-green-500/20 text-green-600' };
    return { title: 'Blijf Oefenen', emoji: '🎧', color: 'bg-gray-500/20 text-gray-600' };
  };

  const saveQuizResult = async (
    userId: string,
    data: QuizShareData
  ): Promise<SavedQuizResult | null> => {
    setIsSaving(true);
    
    try {
      const shareToken = generateShareToken();
      const badge = getBadge(data.percentage);
      
      const { data: result, error } = await supabase
        .from('quiz_results')
        .insert({
          user_id: userId,
          quiz_type: data.quizType,
          questions_total: data.totalQuestions,
          questions_correct: data.score,
          score_percentage: data.percentage,
          share_token: shareToken,
          badge_earned: badge.title,
          is_public: true
        })
        .select('id, share_token')
        .single();
      
      if (error) {
        console.error('Error saving quiz result:', error);
        toast({
          title: "Fout bij opslaan",
          description: "Quiz resultaat kon niet worden opgeslagen",
          variant: "destructive"
        });
        return null;
      }
      
      // Generate share image in background
      generateShareImage(result.id, data, badge);
      
      return {
        id: result.id,
        shareToken: result.share_token
      };
    } catch (error) {
      console.error('Error in saveQuizResult:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareImage = async (
    quizResultId: string,
    data: QuizShareData,
    badge: { title: string; emoji: string }
  ) => {
    setIsGeneratingImage(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-quiz-share-image', {
        body: {
          quizResultId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          percentage: data.percentage,
          quizType: data.quizType,
          badgeTitle: badge.title,
          badgeEmoji: badge.emoji
        }
      });
      
      if (error) {
        console.error('Error generating share image:', error);
        return;
      }
      
      if (result?.shareImageUrl) {
        // Update the quiz result with the image URL
        await supabase
          .from('quiz_results')
          .update({ share_image_url: result.shareImageUrl })
          .eq('id', quizResultId);
      }
    } catch (error) {
      console.error('Error generating share image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const createChallenge = async (
    userId: string,
    quizResultId: string,
    score: number,
    quizType: string,
    totalQuestions: number
  ): Promise<string | null> => {
    try {
      const challengeToken = generateShareToken();
      
      const { error } = await supabase
        .from('quiz_challenges')
        .insert({
          challenger_id: userId,
          quiz_result_id: quizResultId,
          challenge_token: challengeToken,
          challenger_score: score,
          quiz_type: quizType,
          questions_total: totalQuestions,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error creating challenge:', error);
        toast({
          title: "Fout",
          description: "Challenge kon niet worden aangemaakt",
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Challenge aangemaakt!",
        description: "Deel de link om je vrienden uit te dagen",
      });
      
      return challengeToken;
    } catch (error) {
      console.error('Error in createChallenge:', error);
      return null;
    }
  };

  return {
    saveQuizResult,
    createChallenge,
    generateShareToken,
    getBadge,
    isSaving,
    isGeneratingImage
  };
}
