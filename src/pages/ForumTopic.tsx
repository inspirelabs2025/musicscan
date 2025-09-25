import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, Eye, Pin, Star } from 'lucide-react';
import { useForumTopic, useIncrementTopicViews } from '@/hooks/useForumTopics';
import { useForumPosts, useCreateForumPost } from '@/hooks/useForumPosts';
import { ForumPostCard } from '@/components/forum/ForumPostCard';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';

const ForumTopic: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null);
  
  const { data: topic, isLoading: topicLoading } = useForumTopic(topicId);
  const { data: posts, isLoading: postsLoading } = useForumPosts(topicId);
  const incrementViewsMutation = useIncrementTopicViews();
  const createPostMutation = useCreateForumPost(topicId!);
  
  const { register, handleSubmit, reset, watch } = useForm<{ content: string }>();
  const watchContent = watch('content');

  // Increment view count when topic is loaded
  useEffect(() => {
    if (topic && topicId) {
      incrementViewsMutation.mutate(topicId);
    }
  }, [topic, topicId]);

  const onSubmitPost = async (data: { content: string }) => {
    if (!data.content.trim()) return;
    
    try {
      await createPostMutation.mutateAsync({
        content: data.content,
        parent_post_id: replyToPostId || undefined,
      });
      reset();
      setReplyToPostId(null);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleReply = (postId: string) => {
    setReplyToPostId(postId);
    // Scroll to reply form
    document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelReply = () => {
    setReplyToPostId(null);
    reset();
  };

  // Group posts by parent for threading
  const groupedPosts = React.useMemo(() => {
    if (!posts) return [];
    
    const postMap = new Map(posts.map(post => [post.id, post]));
    const rootPosts = posts.filter(post => !post.parent_post_id);
    
    const buildThread = (post: any): any => ({
      ...post,
      replies: posts
        .filter(p => p.parent_post_id === post.id)
        .map(buildThread)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    });
    
    return rootPosts
      .map(buildThread)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [posts]);

  const renderPost = (post: any, depth = 0) => (
    <div key={post.id} className="space-y-3">
      <ForumPostCard
        post={post}
        onReply={handleReply}
        depth={depth}
      />
      {post.replies?.map((reply: any) => renderPost(reply, depth + 1))}
    </div>
  );

  if (topicLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Discussie niet gevonden</h2>
          <p className="text-muted-foreground mb-4">
            Deze discussie bestaat niet of is verwijderd.
          </p>
          <Button onClick={() => navigate('/forum')}>
            Terug naar Forum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/forum')}
        className="mb-6 flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Terug naar Forum</span>
      </Button>

      {/* Topic Header */}
      <div className="bg-card rounded-lg p-6 mb-6 border">
        <div className="flex items-start justify-between space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            {topic.is_pinned && <Pin className="h-4 w-4 text-primary" />}
            {topic.is_featured && <Star className="h-4 w-4 text-amber-500" />}
            <Badge variant={topic.topic_type === 'auto_generated' ? 'secondary' : 'outline'}>
              {topic.topic_type === 'auto_generated' ? 'Wekelijkse Discussie' : 'Community'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{topic.reply_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{topic.view_count}</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">{topic.title}</h1>
        
        {topic.description && (
          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
            {topic.description}
          </p>
        )}

        {(topic.artist_name || topic.album_title) && (
          <div className="flex items-center space-x-2 mb-4">
            {topic.artist_name && (
              <Badge variant="outline" className="text-xs">
                🎤 {topic.artist_name}
              </Badge>
            )}
            {topic.album_title && (
              <Badge variant="outline" className="text-xs">
                💿 {topic.album_title}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={topic.profiles?.avatar_url} />
            <AvatarFallback>
              {topic.profiles?.first_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">
              {topic.profiles?.first_name || 'Unknown User'}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-8">
        {postsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : groupedPosts.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nog geen reacties
            </h3>
            <p className="text-sm text-muted-foreground">
              Wees de eerste om te reageren op deze discussie!
            </p>
          </div>
        ) : (
          groupedPosts.map(post => renderPost(post))
        )}
      </div>

      {/* Reply Form */}
      {user && (
        <div id="reply-form" className="bg-card rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {replyToPostId ? 'Reageer op bericht' : 'Plaats een reactie'}
          </h3>
          
          {replyToPostId && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Je reageert op een bericht
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelReply}
              >
                Annuleren
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmitPost)} className="space-y-4">
            <Textarea
              {...register('content', { required: true })}
              placeholder="Deel je gedachten over deze discussie..."
              className="min-h-[120px]"
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {watchContent?.length || 0}/1000 karakters
              </div>
              
              <Button
                type="submit"
                disabled={createPostMutation.isPending || !watchContent?.trim()}
              >
                {createPostMutation.isPending ? 'Bezig...' : 'Plaats Reactie'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Login prompt for non-authenticated users */}
      {!user && (
        <div className="bg-card rounded-lg p-6 border text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Log in om te reageren</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Je moet ingelogd zijn om deel te nemen aan discussies.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Inloggen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ForumTopic;