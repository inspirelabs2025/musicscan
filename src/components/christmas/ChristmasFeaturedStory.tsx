import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface ChristmasStory {
  id: string;
  title: string;
  artist: string;
  slug: string;
  artwork_url: string | null;
  story_content: string | null;
  single_name: string | null;
}

const stripMarkdown = (text: string): string => {
  return text
    .replace(/^---[\s\S]*?---/m, '') // Remove YAML frontmatter
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Code
    .replace(/>\s/g, '') // Blockquotes
    .replace(/\n{2,}/g, ' ') // Multiple newlines
    .replace(/\n/g, ' ') // Single newlines
    .trim();
};

const extractSummary = (content: string, maxLength: number = 280): string => {
  const stripped = stripMarkdown(content);
  if (stripped.length <= maxLength) return stripped;
  
  const truncated = stripped.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
};

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const ChristmasFeaturedStory = () => {
  const { data: stories, isLoading } = useQuery({
    queryKey: ['christmas-stories-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('id, title, artist, slug, artwork_url, story_content, single_name')
        .contains('tags', ['christmas'])
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChristmasStory[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-12">
        <Card className="bg-gradient-to-br from-red-950/40 via-green-950/30 to-red-950/40 border-red-800/30">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-full md:w-64 h-64 rounded-xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!stories || stories.length === 0) return null;

  // Select story based on day of year for daily rotation
  const dayOfYear = getDayOfYear();
  const storyIndex = dayOfYear % stories.length;
  const featuredStory = stories[storyIndex];

  const summary = featuredStory.story_content 
    ? extractSummary(featuredStory.story_content, 300) 
    : 'Ontdek het verhaal achter dit iconische kerstlied...';

  const displayTitle = featuredStory.single_name || featuredStory.title;

  return (
    <section id="verhaal-van-de-dag" className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-red-950/50 via-green-950/40 to-red-950/50 border-red-800/30 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {/* Badge Header */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400" />
                Verhaal van de Dag
              </span>
              <span className="text-2xl">🎄</span>
            </div>

            {/* Horizontal Layout */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Artwork - Left */}
              <div className="w-full md:w-48 lg:w-56 flex-shrink-0">
                <div className="aspect-square rounded-xl overflow-hidden shadow-lg shadow-black/30">
                  {featuredStory.artwork_url ? (
                    <img
                      src={featuredStory.artwork_url}
                      alt={`${featuredStory.artist} - ${displayTitle}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-900/50 to-green-900/50 flex items-center justify-center">
                      <span className="text-6xl">🎄</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content - Right */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                  {featuredStory.artist}
                </h2>
                <h3 className="text-lg md:text-xl text-red-400 font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{displayTitle}</span>
                </h3>

                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-5 line-clamp-3">
                  "{summary}"
                </p>

                <Button 
                  asChild 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/30"
                >
                  <Link to={`/singles/${featuredStory.slug}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Lees het volledige verhaal
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
};

export default ChristmasFeaturedStory;
