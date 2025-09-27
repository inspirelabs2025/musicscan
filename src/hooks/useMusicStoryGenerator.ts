import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MusicStoryResult {
  story: string;
  query: string;
  blogUrl?: string;
  slug?: string;
  title?: string;
  id?: string;
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
        query: data.query || query,
        blogUrl: data.blogUrl,
        slug: data.slug,
        title: data.title,
        id: data.id
      };

      setCurrentStory(result);
      
      toast({
        title: "Verhaal gegenereerd!",
        description: `Het verhaal achter "${query}" is gevonden en opgeslagen als blog post.`,
      });

      // Navigate to blog post if blogUrl is available
      if (result.blogUrl) {
        setTimeout(() => {
          window.location.href = result.blogUrl;
        }, 1500);
      }

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

  const generateRandomStory = async (): Promise<MusicStoryResult | null> => {
    setIsGenerating(true);
    
    try {
      console.log('Generating random music query...');
      
      // First get a random query from OpenAI
      const { data: randomData, error: randomError } = await supabase.functions.invoke('random-music-query', {
        body: {}
      });

      if (randomError) {
        console.error('Error generating random query:', randomError);
        throw randomError;
      }

      if (!randomData || !randomData.query) {
        throw new Error('No random query generated');
      }

      const randomQuery = randomData.query;
      console.log('Generated random query:', randomQuery);
      
      toast({
        title: "Verrassende keuze!",
        description: `AI heeft gekozen voor: "${randomQuery}"`,
      });

      // Now generate the story for the random query
      const { data, error } = await supabase.functions.invoke('music-story-generator', {
        body: { query: randomQuery }
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
        query: data.query || randomQuery,
        blogUrl: data.blogUrl,
        slug: data.slug,
        title: data.title,
        id: data.id
      };

      setCurrentStory(result);
      
      toast({
        title: "Verhaal gegenereerd!",
        description: `Het verhaal achter "${randomQuery}" is gevonden en opgeslagen als blog post.`,
      });

      // Navigate to blog post if blogUrl is available
      if (result.blogUrl) {
        setTimeout(() => {
          window.location.href = result.blogUrl;
        }, 1500);
      }

      return result;
    } catch (error) {
      console.error('Error in generateRandomStory:', error);
      toast({
        title: "Fout bij verhaal genereren",
        description: "Er ging iets mis bij het genereren van een willekeurig verhaal. Probeer opnieuw.",
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
    generateRandomStory,
    clearStory,
    isGenerating,
    currentStory
  };
};