import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface PhotoCommentsProps {
  photoId: string;
}

interface Comment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  like_count: number;
  parent_comment_id: string | null;
  profiles: {
    user_id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
}

export const PhotoComments: React.FC<PhotoCommentsProps> = ({ photoId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["photo-comments", photoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_comments")
        .select(`
          *,
          profiles:user_id (
            user_id,
            first_name,
            avatar_url
          )
        `)
        .eq("photo_id", photoId)
        .eq("status", "visible")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Comment[];
    },
  });

  // Real-time subscription for comments
  useEffect(() => {
    const channel = supabase
      .channel(`photo-comments-${photoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_comments',
          filter: `photo_id=eq.${photoId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["photo-comments", photoId] });
          queryClient.invalidateQueries({ queryKey: ["photo", photoId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, queryClient]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ text, parentId }: { text: string; parentId?: string }) => {
      if (!user) throw new Error("Login vereist");
      if (!text.trim()) throw new Error("Commentaar is leeg");

      const { error } = await supabase
        .from("photo_comments")
        .insert({
          photo_id: photoId,
          user_id: user.id,
          body: text.trim(),
          parent_comment_id: parentId || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["photo-comments", photoId] });
      toast({
        title: "Succes",
        description: "Commentaar geplaatst",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("photo_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-comments", photoId] });
      toast({
        title: "Verwijderd",
        description: "Commentaar verwijderd",
      });
    },
  });

  // Organize comments into parent and replies
  const parentComments = comments?.filter(c => !c.parent_comment_id) || [];
  const getReplies = (parentId: string) => comments?.filter(c => c.parent_comment_id === parentId) || [];

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [localLiked, setLocalLiked] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(comment.like_count || 0);

    const { data: commentLike } = useQuery({
      queryKey: ["comment-like", comment.id, user?.id],
      enabled: !!user,
      queryFn: async () => {
        const { data } = await supabase
          .from("comment_likes")
          .select("id")
          .eq("comment_id", comment.id)
          .eq("user_id", user!.id)
          .maybeSingle();
        return data;
      },
    });

    useEffect(() => {
      setLocalLiked(!!commentLike);
    }, [commentLike]);

    const toggleLike = async () => {
      if (!user) {
        toast({ title: "Login vereist", variant: "destructive" });
        return;
      }

      const newLikedState = !localLiked;
      setLocalLiked(newLikedState);
      setLocalLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

      try {
        if (localLiked) {
          await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", comment.id)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("comment_likes")
            .insert({ comment_id: comment.id, user_id: user.id });
        }
        queryClient.invalidateQueries({ queryKey: ["comment-like", comment.id] });
      } catch (error) {
        setLocalLiked(!newLikedState);
        setLocalLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        toast({ title: "Fout bij liken", variant: "destructive" });
      }
    };

    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
        <div className="flex gap-3">
          <Link to={`/profile/${comment.user_id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {comment.profiles?.first_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${comment.user_id}`} className="font-semibold text-sm hover:underline">
                  {comment.profiles?.first_name || "Gebruiker"}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: nl })}
                </span>
              </div>

              {user?.id === comment.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <p className="text-sm">{comment.body}</p>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className={`h-8 gap-1 ${localLiked ? 'text-primary' : ''}`}
              >
                <Heart className={`h-4 w-4 ${localLiked ? 'fill-current' : ''}`} />
                {localLikeCount > 0 && <span className="text-xs">{localLikeCount}</span>}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="h-8 gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">Reageer</span>
                </Button>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reageer op ${comment.profiles?.first_name}...`}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addCommentMutation.mutate({ text: replyText, parentId: comment.id })}
                    disabled={!replyText.trim() || addCommentMutation.isPending}
                  >
                    Verstuur
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      {user ? (
        <div className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Deel je gedachten..."
            rows={3}
          />
          <Button
            onClick={() => addCommentMutation.mutate({ text: commentText })}
            disabled={!commentText.trim() || addCommentMutation.isPending}
          >
            Plaats Commentaar
          </Button>
        </div>
      ) : (
        <div className="text-center py-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Log in om een commentaar te plaatsen</p>
          <Button size="sm" onClick={() => window.location.href = "/auth"}>Inloggen</Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {parentComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nog geen reacties. Wees de eerste!</p>
          </div>
        ) : (
          parentComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};
