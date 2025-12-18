import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useArtistSpotlights, useDeleteSpotlight, useUpdateSpotlight } from "@/hooks/useArtistSpotlight";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getCardImageUrl = (story: any): string | null => {
  if (story?.artwork_url) return story.artwork_url;

  const imgs = story?.spotlight_images;
  const url = Array.isArray(imgs) ? imgs?.[0]?.url : null;
  if (typeof url === 'string' && url.startsWith('http') && url.length < 1000) return url;

  return null;
};

const ArtistSpotlights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data: allSpotlights, isLoading } = useArtistSpotlights({ published: false });
  const deleteMutation = useDeleteSpotlight();
  const updateMutation = useUpdateSpotlight();

  const filteredSpotlights = allSpotlights?.filter(story => {
    if (filter === 'published') return story.is_published;
    if (filter === 'draft') return !story.is_published;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast({
          title: "✅ Verwijderd",
          description: "Spotlight succesvol verwijderd.",
        });
        setDeleteId(null);
      },
      onError: (error) => {
        toast({
          title: "Verwijderen mislukt",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    updateMutation.mutate(
      { id, updates: { is_published: !currentStatus } },
      {
        onSuccess: () => {
          toast({
            title: !currentStatus ? "✅ Gepubliceerd" : "📝 Concept",
            description: !currentStatus 
              ? "Spotlight is nu zichtbaar voor bezoekers." 
              : "Spotlight is nu een concept.",
          });
        },
        onError: (error) => {
          toast({
            title: "Actie mislukt",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Artiest Spotlights</h1>
            <p className="text-muted-foreground">
              Beheer uitgebreide spotlight verhalen over artiesten
            </p>
          </div>
          <Button onClick={() => navigate('/admin/artist-spotlight/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Spotlight
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="published">Gepubliceerd</TabsTrigger>
            <TabsTrigger value="draft">Concepten</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !filteredSpotlights || filteredSpotlights.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {filter === 'all' 
                      ? 'Nog geen spotlights aangemaakt' 
                      : filter === 'published'
                      ? 'Geen gepubliceerde spotlights'
                      : 'Geen concept spotlights'}
                  </p>
                  <Button onClick={() => navigate('/admin/artist-spotlight/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Eerste Spotlight Maken
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSpotlights.map((story) => {
                  const cardImageUrl = getCardImageUrl(story);

                  return (
                    <Card key={story.id} className="overflow-hidden">
                      {cardImageUrl && (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img
                            src={cardImageUrl}
                            alt={story.artist_name}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1">
                            {story.artist_name}
                          </CardTitle>
                          <Badge variant={story.is_published ? "default" : "secondary"}>
                            {story.is_published ? "Live" : "Concept"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {story.spotlight_description || "Geen beschrijving"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <span>{story.views_count} views</span>
                          <span>•</span>
                          <span>{story.reading_time} min lezen</span>
                          <span>•</span>
                          <span>{story.word_count} woorden</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/artist-spotlight/edit/${story.id}`)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bewerken
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePublish(story.id, story.is_published)}
                          >
                            {story.is_published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteId(story.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spotlight verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit kan niet ongedaan gemaakt worden. De spotlight wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ArtistSpotlights;
