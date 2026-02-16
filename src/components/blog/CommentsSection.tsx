import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ThumbsUp, ThumbsDown, Reply, Edit2, Trash2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface Comment {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_comment_id?: string;
  profiles?: { first_name: string } | null;
  replies?: Comment[];
  user_vote?: 'upvote' | 'downvote' | null;
}

interface CommentsSectionProps {
  blogPostId: string;
}

export function CommentsSection({ blogPostId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tr } = useLanguage();
  const c = tr.contentUI;
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog_comments').select('*').eq('blog_post_id', blogPostId)
        .order('created_at', { ascending: true });
      if (commentsError) throw commentsError;

      let userVotes: Record<string, string> = {};
      if (user && commentsData?.length) {
        const { data: votesData, error: votesError } = await supabase
          .from('blog_comment_votes').select('comment_id, vote_type')
          .eq('user_id', user.id).in('comment_id', commentsData.map(c => c.id));
        if (!votesError && votesData) {
          userVotes = votesData.reduce((acc, vote) => { acc[vote.comment_id] = vote.vote_type; return acc; }, {} as Record<string, string>);
        }
      }

      const topLevelComments = commentsData?.filter(c => !c.parent_comment_id) || [];
      const repliesMap = (commentsData || []).reduce((acc, comment) => {
        if (comment.parent_comment_id) {
          if (!acc[comment.parent_comment_id]) acc[comment.parent_comment_id] = [];
          acc[comment.parent_comment_id].push({ ...comment, user_vote: userVotes[comment.id] as any });
        }
        return acc;
      }, {} as Record<string, Comment[]>);

      setComments(topLevelComments.map(comment => ({
        ...comment, replies: repliesMap[comment.id] || [],
        user_vote: userVotes[comment.id] as any
      })));
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({ title: c.errorGeneric, description: c.couldNotLoadComments, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [blogPostId, user]);

  const handleSubmitComment = async () => {
    if (!user) { toast({ title: c.loginRequiredComment, description: c.mustBeLoggedInComment, variant: 'destructive' }); return; }
    if (!newComment.trim()) { toast({ title: c.emptyComment, description: c.writeFirst, variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('blog_comments').insert({ blog_post_id: blogPostId, user_id: user.id, content: newComment.trim() });
      if (error) throw error;
      setNewComment('');
      toast({ title: c.commentPosted, description: c.commentPostedDesc });
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({ title: c.errorGeneric, description: c.errorPostingComment, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    try {
      const { error } = await supabase.from('blog_comments').insert({ blog_post_id: blogPostId, user_id: user.id, parent_comment_id: parentId, content: replyContent.trim() });
      if (error) throw error;
      setReplyingTo(null); setReplyContent('');
      toast({ title: c.commentPosted, description: c.commentPostedDesc });
      await loadComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({ title: c.errorGeneric, description: c.errorPostingComment, variant: 'destructive' });
    }
  };

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) { toast({ title: c.loginRequiredComment, description: c.mustBeLoggedInVote, variant: 'destructive' }); return; }
    try {
      const comment = comments.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === commentId);
      if (comment?.user_vote === voteType) {
        await supabase.from('blog_comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('blog_comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: voteType });
      }
      await loadComments();
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: c.errorGeneric, description: c.errorVoting, variant: 'destructive' });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase.from('blog_comments').update({ content: editContent.trim() }).eq('id', commentId);
      if (error) throw error;
      setEditingComment(null); setEditContent('');
      toast({ title: c.commentUpdated, description: c.commentUpdatedDesc });
      await loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({ title: c.errorGeneric, description: c.errorUpdatingComment, variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
      if (error) throw error;
      toast({ title: c.commentDeleted, description: c.commentDeletedDesc });
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: c.errorGeneric, description: c.errorDeletingComment, variant: 'destructive' });
    }
  };

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{comment.profiles?.first_name?.charAt(0) || 'A'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.profiles?.first_name || c.anonymous}</span>
            <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString('nl-NL')}</span>
            {comment.updated_at !== comment.created_at && (
              <Badge variant="secondary" className="text-xs">{c.edited}</Badge>
            )}
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEditComment(comment.id)}>{c.save}</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingComment(null); setEditContent(''); }}>{c.cancel}</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mb-2">{comment.content}</p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className={`h-auto p-1 ${comment.user_vote === 'upvote' ? 'text-green-600' : ''}`}
                    onClick={() => handleVote(comment.id, 'upvote')}>
                    <ThumbsUp size={12} className="mr-1" />{comment.upvotes}
                  </Button>
                  <Button variant="ghost" size="sm" className={`h-auto p-1 ${comment.user_vote === 'downvote' ? 'text-red-600' : ''}`}
                    onClick={() => handleVote(comment.id, 'downvote')}>
                    <ThumbsDown size={12} className="mr-1" />{comment.downvotes}
                  </Button>
                </div>
                {!isReply && (
                  <Button variant="ghost" size="sm" className="h-auto p-1"
                    onClick={() => { setReplyingTo(comment.id); setReplyContent(''); }}>
                    <Reply size={12} className="mr-1" />{c.reply}
                  </Button>
                )}
                {user?.id === comment.user_id && (
                  <>
                    <Button variant="ghost" size="sm" className="h-auto p-1"
                      onClick={() => { setEditingComment(comment.id); setEditContent(comment.content); }}>
                      <Edit2 size={12} className="mr-1" />{c.edit}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-1 text-red-600"
                      onClick={() => handleDeleteComment(comment.id)}>
                      <Trash2 size={12} className="mr-1" />{c.delete}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {replyingTo === comment.id && (
        <div className="ml-11 mb-4">
          <Textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
            placeholder={c.writeReplyPlaceholder} rows={3} className="mb-2" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>{c.reply}</Button>
            <Button size="sm" variant="outline" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>{c.cancel}</Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentComponent key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <Card><CardHeader><CardTitle>{c.loadingComments}</CardTitle></CardHeader></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />{c.comments} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user ? (
          <div className="space-y-3">
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder={c.shareThoughts} rows={4} />
            <Button onClick={handleSubmitComment} disabled={isSubmitting}>
              {isSubmitting ? c.posting : c.postComment}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground"><p>{c.loginToComment}</p></div>
        )}
        <div className="space-y-6">
          {comments.map((comment) => <CommentComponent key={comment.id} comment={comment} />)}
        </div>
        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>{c.noCommentsYet}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
