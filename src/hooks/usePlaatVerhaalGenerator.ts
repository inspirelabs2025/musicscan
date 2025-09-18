import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  album_id: string;
  album_type: 'cd' | 'vinyl';
  user_id: string;
  yaml_frontmatter: Record<string, any>;
  markdown_content: string;
  social_post?: string;
  product_card?: Record<string, any>;
  slug: string;
  published_at?: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface GenerateBlogResult {
  blog: BlogPost;
  cached: boolean;
}

export const usePlaatVerhaalGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const generateBlog = async (albumId: string, albumType: 'cd' | 'vinyl'): Promise<BlogPost | null> => {
    setIsGenerating(true);
    try {
      console.log('Generating Plaat & Verhaal blog for:', { albumId, albumType });

      const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
        body: {
          albumId,
          albumType
        }
      });

      if (error) {
        console.error('Blog generation error:', error);
        throw error;
      }

      const result = data as GenerateBlogResult;
      setBlogPost(result.blog);

      if (result.cached) {
        toast({
          title: "Blog gevonden",
          description: "Er bestaat al een blog voor dit album",
        });
      } else {
        toast({
          title: "Blog gegenereerd",
          description: "Het Plaat & Verhaal artikel is succesvol aangemaakt",
        });
      }

      return result.blog;
    } catch (error) {
      console.error('Error generating blog:', error);
      toast({
        title: "Fout bij blog generatie",
        description: "Er is een fout opgetreden bij het genereren van de blog",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const publishBlog = async (blogId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', blogId);

      if (error) throw error;

      setBlogPost(prev => prev ? { ...prev, is_published: true, published_at: new Date().toISOString() } : null);

      toast({
        title: "Blog gepubliceerd",
        description: "Het artikel is nu live beschikbaar",
      });

      return true;
    } catch (error) {
      console.error('Error publishing blog:', error);
      toast({
        title: "Fout bij publiceren",
        description: "Er is een fout opgetreden bij het publiceren",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateBlog = async (blogId: string, updates: Partial<BlogPost>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', blogId);

      if (error) throw error;

      setBlogPost(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: "Blog bijgewerkt",
        description: "De wijzigingen zijn opgeslagen",
      });

      return true;
    } catch (error) {
      console.error('Error updating blog:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het opslaan",
        variant: "destructive"
      });
      return false;
    }
  };

  const getBlogByAlbum = async (albumId: string, albumType: 'cd' | 'vinyl'): Promise<BlogPost | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('album_id', albumId)
        .eq('album_type', albumType)
        .maybeSingle();

      if (error) throw error;

      const blogPost = data as BlogPost | null;
      setBlogPost(blogPost);
      return blogPost;
    } catch (error) {
      console.error('Error fetching blog:', error);
      return null;
    }
  };

  const getUserBlogs = async (published?: boolean) => {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (published !== undefined) {
        query = query.eq('is_published', published);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as BlogPost[]) || [];
    } catch (error) {
      console.error('Error fetching user blogs:', error);
      return [];
    }
  };

  return {
    isGenerating,
    blogPost,
    generateBlog,
    publishBlog,
    updateBlog,
    getBlogByAlbum,
    getUserBlogs,
    setBlogPost
  };
};