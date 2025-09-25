import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ForumPost {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  parent_post_id?: string;
  is_edited: boolean;
  edited_at?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    avatar_url?: string;
  };
  user_vote?: {
    vote_type: 'upvote' | 'downvote';
  }[];
}

export interface CreatePostData {
  content: string;
  parent_post_id?: string;
}

export const useForumPosts = (topicId: string | undefined) => {
  return useQuery({
    queryKey: ['forum-posts', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles(first_name, avatar_url),
          user_vote:forum_post_votes(vote_type)
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!topicId,
  });
};

export const useCreateForumPost = (topicId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          ...postData,
          topic_id: topicId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', topicId] });
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating post:', error);
    },
  });
};

export const useVoteForumPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, voteType }: { postId: string; voteType: 'upvote' | 'downvote' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('forum_post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          const { error } = await supabase
            .from('forum_post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
          
          if (error) throw error;
        } else {
          // Update vote if different type
          const { error } = await supabase
            .from('forum_post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user.id);
          
          if (error) throw error;
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('forum_post_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
      console.error('Error voting:', error);
    },
  });
};