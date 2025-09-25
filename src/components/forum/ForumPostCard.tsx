import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, Reply } from 'lucide-react';
import { ForumPost } from '@/hooks/useForumPosts';
import { formatDistanceToNow } from 'date-fns';
import { useVoteForumPost } from '@/hooks/useForumPosts';

interface ForumPostCardProps {
  post: ForumPost;
  onReply: (postId: string) => void;
  depth?: number;
}

export const ForumPostCard: React.FC<ForumPostCardProps> = ({ post, onReply, depth = 0 }) => {
  const votePostMutation = useVoteForumPost();
  const userVote = post.user_vote?.[0]?.vote_type;

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    votePostMutation.mutate({ postId: post.id, voteType });
  };

  return (
    <Card className={`${depth > 0 ? 'ml-8 border-l-2 border-l-primary/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback>
              {post.profiles?.first_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm">
                {post.profiles?.first_name || 'Unknown User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.is_edited && (
                <span className="text-xs text-muted-foreground italic">
                  (bewerkt)
                </span>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none mb-3">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant={userVote === 'upvote' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleVote('upvote')}
                  disabled={votePostMutation.isPending}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">{post.upvotes}</span>
                </Button>
                
                <Button
                  variant={userVote === 'downvote' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleVote('downvote')}
                  disabled={votePostMutation.isPending}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  <span className="text-xs">{post.downvotes}</span>
                </Button>
              </div>
              
              {depth < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(post.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  <span className="text-xs">Reageren</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};