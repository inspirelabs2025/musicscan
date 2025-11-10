import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, MessageCircle, MapPin, Calendar, Music, Flag, Image as ImageIcon, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { usePosterProductCreator } from "@/hooks/usePosterProductCreator";
import { useNavigate } from "react-router-dom";

export default function PhotoDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { createPosterProduct, isCreating } = usePosterProductCreator();

  const { data: photo, isLoading } = useQuery({
    queryKey: ["photo", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("seo_slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["photo-comments", photo?.id],
    enabled: !!photo?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_comments")
        .select(`
          *,
          profiles:user_id (
            first_name,
            avatar_url
          )
        `)
        .eq("photo_id", photo.id)
        .eq("status", "visible")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: userLike } = useQuery({
    queryKey: ["photo-like", photo?.id, user?.id],
    enabled: !!photo?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("photo_likes")
        .select("*")
        .eq("photo_id", photo.id)
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login vereist");
      
      if (userLike) {
        await supabase
          .from("photo_likes")
          .delete()
          .eq("id", userLike.id);
      } else {
        await supabase
          .from("photo_likes")
          .insert({ photo_id: photo.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo", slug] });
      queryClient.invalidateQueries({ queryKey: ["photo-like", photo?.id, user?.id] });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon like niet verwerken",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportReason) throw new Error("Selecteer een reden");

      // Increment flag count
      const { error: updateError } = await supabase
        .from("photos")
        .update({ 
          flagged_count: (photo.flagged_count || 0) + 1,
          status: (photo.flagged_count || 0) >= 2 ? "flagged" : photo.status
        })
        .eq("id", photo.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setShowReportDialog(false);
      setReportReason("");
      queryClient.invalidateQueries({ queryKey: ["photo", slug] });
      toast({
        title: "Gemeld",
        description: "Bedankt voor je melding. We zullen deze foto beoordelen.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon melding niet versturen",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login vereist");
      if (!commentText.trim()) throw new Error("Commentaar is leeg");
      
      await supabase
        .from("photo_comments")
        .insert({
          photo_id: photo.id,
          user_id: user.id,
          body: commentText.trim(),
        });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["photo-comments", photo?.id] });
      queryClient.invalidateQueries({ queryKey: ["photo", slug] });
      toast({
        title: "Succes",
        description: "Commentaar toegevoegd",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon commentaar niet plaatsen",
        variant: "destructive",
      });
    },
  });

  // Track view on mount
  useState(() => {
    if (photo?.id) {
      supabase.from("photo_views").insert({
        photo_id: photo.id,
        user_id: user?.id,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["photo", slug] });
      });
    }
  });

  const handleOrderPoster = async () => {
    if (!photo) return;
    
    try {
      // Convert image URL to base64
      const response = await fetch(photo.display_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const result = await createPosterProduct({
        stylizedImage: base64,
        artist: photo.artist || "Onbekend",
        title: photo.caption || photo.seo_title || "Muziek Herinnering",
        description: photo.seo_description || photo.caption || "",
        style: 'original' as any,
        price: 24.99,
      });

      navigate(`/products/${result.product_slug}`);
    } catch (error) {
      console.error("Order poster error:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  }

  if (!photo) {
    return <div className="min-h-screen flex items-center justify-center">Foto niet gevonden</div>;
  }

  const canonicalUrl = photo.canonical_url || `https://www.musicscan.app/photo/${photo.seo_slug}`;

  return (
    <>
      <Helmet>
        <title>{photo.seo_title || photo.caption || "Muziek Herinnering"} | MusicScan</title>
        <meta name="description" content={photo.seo_description || photo.caption || "Een muziek herinnering gedeeld op MusicScan FanWall"} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={photo.seo_title || photo.caption} />
        <meta property="og:description" content={photo.seo_description || photo.caption} />
        <meta property="og:image" content={photo.display_url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={photo.display_url} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "name": photo.seo_title || photo.caption,
            "description": photo.seo_description || photo.caption,
            "contentUrl": photo.display_url,
            "datePublished": photo.published_at,
            "author": {
              "@type": "Person",
              "name": "MusicScan User"
            },
            "keywords": photo.tags?.join(", "),
            "isFamilyFriendly": true
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <img
                    src={photo.display_url}
                    alt={photo.seo_title || "Music memory"}
                    className="w-full h-auto"
                  />
                </Card>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  {photo.artist && (
                    <Badge variant="secondary" className="gap-1">
                      <Music className="h-3 w-3" />
                      {photo.artist}
                    </Badge>
                  )}
                  {photo.year && (
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {photo.year}
                    </Badge>
                  )}
                  {photo.city && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {photo.city}
                    </Badge>
                  )}
                  {photo.format && (
                    <Badge variant="outline">{photo.format}</Badge>
                  )}
                </div>

                {/* Tags */}
                {photo.tags && photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Caption */}
                {photo.caption && (
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{photo.caption}</h1>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{photo.view_count || 0}</span>
                  </div>
                  <Button
                    variant={userLike ? "default" : "outline"}
                    size="lg"
                    onClick={() => likeMutation.mutate()}
                    disabled={!user || likeMutation.isPending}
                    className="gap-2"
                  >
                    <Heart className={`h-5 w-5 ${userLike ? "fill-current" : ""}`} />
                    {photo.like_count}
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {photo.comment_count}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportDialog(true)}
                    className="gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Meld
                  </Button>
                </div>

                {/* Order Poster */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Bestel als Poster</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Krijg deze herinnering als hoogwaardige kunstposter (vanaf €24,99)
                      </p>
                      <Button 
                        onClick={handleOrderPoster}
                        disabled={isCreating}
                        className="gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {isCreating ? "Bezig..." : "Maak Poster"}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Comments */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Reacties</h2>
                  
                  {user ? (
                    <div className="mb-6">
                      <Textarea
                        placeholder="Voeg een reactie toe..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        onClick={() => commentMutation.mutate()}
                        disabled={!commentText.trim() || commentMutation.isPending}
                      >
                        Plaats reactie
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mb-6">Log in om te reageren</p>
                  )}

                  <div className="space-y-4">
                    {comments && comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {comment.profiles?.first_name?.[0] || "?"}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {comment.profiles?.first_name || "Anoniem"}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {format(new Date(comment.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                              </p>
                              <p className="text-sm">{comment.body}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nog geen reacties</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Foto Melden</DialogTitle>
              <DialogDescription>
                Help ons de community veilig te houden door ongepaste content te melden.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Reden</label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een reden" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="copyright">Auteursrechtschending</SelectItem>
                    <SelectItem value="inappropriate">Ongepaste inhoud</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="misleading">Misleidend</SelectItem>
                    <SelectItem value="other">Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Annuleren
              </Button>
              <Button
                onClick={() => reportMutation.mutate()}
                disabled={!reportReason || reportMutation.isPending}
              >
                Verstuur Melding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
