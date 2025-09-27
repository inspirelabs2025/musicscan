import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MusicStoryResult {
  story: string;
  query: string;
}

export const useMusicStoryGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStory, setCurrentStory] = useState<MusicStoryResult | null>(null);
  const { toast } = useToast();

  const generateStory = async (query: string): Promise<MusicStoryResult | null> => {
    if (!query.trim()) {
      toast({
        title: "Voer een zoekopdracht in",
        description: "Typ een song, artiest of album om het verhaal te ontdekken.",
        variant: "destructive",
      });
      return null;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generating music story for:', query);
      
      const { data, error } = await supabase.functions.invoke('music-story-generator', {
        body: { query: query.trim() }
      });

      if (error) {
        console.error('Error generating music story:', error);
        throw error;
      }

      if (!data || !data.story) {
        throw new Error('No story generated');
      }

      const result: MusicStoryResult = {
        story: data.story,
        query: data.query || query
      };

      setCurrentStory(result);
      
      toast({
        title: "Verhaal gegenereerd!",
        description: `Het verhaal achter "${query}" is gevonden.`,
      });

      return result;
    } catch (error) {
      console.error('Error in generateStory:', error);
      toast({
        title: "Fout bij verhaal genereren",
        description: "Er ging iets mis bij het zoeken naar het verhaal. Probeer opnieuw.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearStory = () => {
    setCurrentStory(null);
  };

  return {
    generateStory,
    clearStory,
    isGenerating,
    currentStory
  };
};