import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ForumTopic {
  id: string;
  title: string;
  description?: string;
  topic_type: 'user_created' | 'auto_generated';
  status: 'active' | 'closed';
  artist_name?: string;
  album_title?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  reply_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  profiles?: {
    first_name: string;
    avatar_url?: string;
  };
}

export interface CreateTopicData {
  title: string;
  description?: string;
  artist_name?: string;
  album_title?: string;
}

export const useForumTopics = (filter: 'all' | 'featured' | 'recent' = 'all') => {
  return useQuery({
    queryKey: ['forum-topics', filter],
    queryFn: async () => {
      let query = supabase
        .from('forum_topics')
        .select(`
          *,
          profiles!created_by(first_name, avatar_url)
        `)
        .eq('status', 'active');

      if (filter === 'featured') {
        query = query.eq('is_featured', true);
      }

      query = query.order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useForumTopic = (topicId: string | undefined) => {
  return useQuery({
    queryKey: ['forum-topic', topicId],
    queryFn: async () => {
      if (!topicId) return null;
      
      const { data, error } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles!created_by(first_name, avatar_url)
        `)
        .eq('id', topicId)
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!topicId,
  });
};

export const useCreateForumTopic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (topicData: CreateTopicData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('forum_topics')
        .insert({
          ...topicData,
          created_by: user.id,
          topic_type: 'user_created'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      toast({
        title: "Topic Created",
        description: "Your discussion topic has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating topic:', error);
    },
  });
};

export const useIncrementTopicViews = () => {
  return useMutation({
    mutationFn: async (topicId: string) => {
      // Simple increment without RPC for now
      const { data: topic } = await supabase
        .from('forum_topics')
        .select('view_count')
        .eq('id', topicId)
        .single();
      
      if (topic) {
        await supabase
          .from('forum_topics')
          .update({ view_count: topic.view_count + 1 })
          .eq('id', topicId);
      }
    },
  });
};