import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Save, Eye, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGenerateSpotlight, useUpdateSpotlight, useArtistSpotlightById, useFormatSpotlight, useDeleteSpotlight, useGenerateSpotlightImages, useInsertImagesToSpotlight } from "@/hooks/useArtistSpotlight";
import ReactMarkdown from "react-markdown";
import { Separator } from "@/components/ui/separator";
import { SpotlightImageManager } from "./SpotlightImageManager";
import type { SpotlightImage } from "@/hooks/useSpotlightImages";
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

export const ArtistSpotlightEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [artistName, setArtistName] = useState("");
  const [initialText, setInitialText] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [spotlightDescription, setSpotlightDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [discogsArtistId, setDiscogsArtistId] = useState<number | undefined>();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateArtistName, setDuplicateArtistName] = useState("");

  // Only fetch existing story if we're editing (id exists)
  const { data: existingStory, isLoading: loadingStory } = useArtistSpotlightById(id || "", {
    enabled: isEditing
  });
  const generateMutation = useGenerateSpotlight();
  const updateMutation = useUpdateSpotlight();
  const formatMutation = useFormatSpotlight();
  const deleteMutation = useDeleteSpotlight();
  const generateImagesMutation = useGenerateSpotlightImages();
  const insertImagesMutation = useInsertImagesToSpotlight();

  // Update word count when text changes
  useEffect(() => {
    const words = initialText.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [initialText]);

  // Load existing story if editing
  useEffect(() => {
    if (existingStory) {
      setArtistName(existingStory.artist_name);
      setStoryContent(existingStory.story_content);
      setSpotlightDescription(existingStory.spotlight_description || "");
      setIsPublished(existingStory.is_published);
      setDiscogsArtistId(existingStory.discogs_artist_id || undefined);
      setGeneratedStoryId(existingStory.id);
    }
  }, [existingStory]);

  const handleGenerate = async (force: boolean = false) => {
    if (!artistName.trim()) {
      toast({
        title: "Artiest naam vereist",
        description: "Voer een artiest naam in om te genereren.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(
      { artistName, initialText, force },
      {
        onSuccess: (data) => {
          // Handle duplicate detection
          if (data?.success === false && data?.code === 'DUPLICATE') {
            // Show dialog to ask if user wants to create anyway
            setDuplicateArtistName(artistName);
            setShowDuplicateDialog(true);
            return;
          }

          // Normal success flow
          if (data.story) {
            setStoryContent(data.story.story_content);
            setSpotlightDescription(data.story.spotlight_description);
            setGeneratedStoryId(data.story.id);
            setShowPreview(true);
            toast({
              title: "✨ Spotlight gegenereerd!",
              description: "AI heeft een uitgebreid spotlight verhaal gemaakt. Bekijk en bewerk naar wens.",
            });
          }
        },
        onError: (error: any) => {
          // Try to parse error context for better messages
          const errorBody = error?.context?.body;
          const errorMessage = errorBody?.error || error.message || "Er is een fout opgetreden bij het genereren.";
          
          toast({
            title: "Generatie mislukt",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleForceGenerate = () => {
    setShowDuplicateDialog(false);
    handleGenerate(true);
  };

  const handleFormatAndSave = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Artiest naam vereist",
        description: "Voer een artiest naam in.",
        variant: "destructive",
      });
      return;
    }

    if (wordCount < 100) {
      toast({
        title: "Tekst te kort",
        description: "De tekst moet minimaal 100 woorden bevatten.",
        variant: "destructive",
      });
      return;
    }

    formatMutation.mutate(
      { artistName, fullText: initialText },
      {
        onSuccess: (data) => {
          // Handle duplicate
          if (data?.success === false && data?.code === 'DUPLICATE') {
            toast({
              title: "Spotlight bestaat al",
              description: `Er bestaat al een spotlight voor ${artistName}.`,
              variant: "default",
            });
            if (data.existing_id) {
              navigate(`/admin/artist-spotlight/edit/${data.existing_id}`);
            }
            return;
          }

          // Success - navigate to edit
          if (data?.story) {
            toast({
              title: "✅ Spotlight aangemaakt",
              description: "Tekst is opgemaakt en opgeslagen. Je kunt nu bekijken en publiceren.",
            });
            navigate(`/admin/artist-spotlight/edit/${data.story.id}`);
          }
        },
        onError: (error: any) => {
          const errorMessage = error?.message || "Er is een fout opgetreden bij het opslaan.";
          toast({
            title: "Opslaan mislukt",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSave = async () => {
    if (!generatedStoryId) {
      toast({
        title: "Geen spotlight om op te slaan",
        description: "Genereer eerst een spotlight voordat je opslaat.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(
      {
        id: generatedStoryId,
        updates: {
          story_content: storyContent,
          spotlight_description: spotlightDescription,
          is_published: isPublished,
          discogs_artist_id: discogsArtistId,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "✅ Opgeslagen",
            description: `Spotlight ${isPublished ? 'gepubliceerd' : 'als concept opgeslagen'}.`,
          });
          navigate('/admin/artist-spotlights');
        },
        onError: (error) => {
          toast({
            title: "Opslaan mislukt",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!generatedStoryId) return;

    if (!confirm(`Weet je zeker dat je de spotlight voor ${artistName} wilt verwijderen?`)) {
      return;
    }

    deleteMutation.mutate(generatedStoryId, {
      onSuccess: () => {
        toast({
          title: "✅ Verwijderd",
          description: "Spotlight is succesvol verwijderd.",
        });
        navigate('/admin/artist-spotlights');
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

  const handleGenerateImages = async () => {
    if (!generatedStoryId) return;

    generateImagesMutation.mutate(generatedStoryId, {
      onSuccess: (data) => {
        toast({
          title: "✨ Afbeeldingen gegenereerd!",
          description: `${data.images.length} AI afbeeldingen zijn toegevoegd.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Fout bij genereren afbeeldingen",
          description: error.message || "Er is een fout opgetreden.",
          variant: "destructive",
        });
      },
    });
  };

  const handleInsertImages = async (selectedImages: SpotlightImage[]) => {
    if (!generatedStoryId || selectedImages.length === 0) return;

    const imagesToInsert = selectedImages.map(img => ({
      url: img.image_url,
      title: img.title,
      context: img.context,
      insertion_point: img.insertion_point,
    }));

    insertImagesMutation.mutate(
      { spotlightId: generatedStoryId, images: imagesToInsert },
      {
        onSuccess: (data) => {
          setStoryContent(data.story_content);
          toast({
            title: "✨ Afbeeldingen toegevoegd!",
            description: `${imagesToInsert.length} afbeeldingen zijn toegevoegd aan de spotlight.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Fout bij toevoegen afbeeldingen",
            description: error.message || "Er is een fout opgetreden.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (loadingStory && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Bewerk Spotlight' : 'Nieuwe Artiest Spotlight'}
          </h1>
          <p className="text-muted-foreground">
            Genereer een uitgebreid spotlight verhaal met AI
          </p>
        </div>
        {generatedStoryId && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-muted/50">
              <Label htmlFor="publish-header" className="cursor-pointer">
                Publiceren
              </Label>
              <Switch
                id="publish-header"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDelete} 
                disabled={deleteMutation.isPending}
                variant="destructive"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Verwijderen
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Opslaan
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Artiest Informatie</CardTitle>
            <CardDescription>
              Voer de artiest naam in en optioneel een starttekst
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artistName">Artiest Naam *</Label>
              <Input
                id="artistName"
                placeholder="Bijv. The Beatles, Miles Davis, Madonna..."
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discogsArtistId">Discogs Artist ID (optioneel)</Label>
              <Input
                id="discogsArtistId"
                type="number"
                value={discogsArtistId || ''}
                onChange={(e) => setDiscogsArtistId(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="bijv. 30041 voor Miles Davis"
              />
              <p className="text-xs text-muted-foreground">
                Voer het Discogs Artist ID in om album covers op te kunnen halen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialText">Volledige tekst</Label>
              <Textarea
                id="initialText"
                placeholder="Plak hier je volledige tekst (minimaal 100 woorden)..."
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                disabled={generateMutation.isPending || formatMutation.isPending}
                rows={20}
                className="resize-y"
              />
              <p className="text-sm text-muted-foreground">
                {wordCount} {wordCount === 1 ? 'woord' : 'woorden'}
                {wordCount < 100 && wordCount > 0 && (
                  <span className="text-destructive ml-2">
                    (minimaal 100 woorden vereist)
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleGenerate(false)} 
                disabled={!artistName.trim() || generateMutation.isPending || formatMutation.isPending}
                variant="outline"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI genereert...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genereer spotlight
                  </>
                )}
              </Button>

              <Button
                onClick={handleFormatAndSave}
                disabled={!artistName.trim() || wordCount < 100 || formatMutation.isPending || generateMutation.isPending}
                size="lg"
              >
                {formatMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Formatteer tekst...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Formatteer en opslaan
                  </>
                )}
              </Button>
            </div>

            {generatedStoryId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Spotlight Beschrijving</Label>
                    <Textarea
                      id="description"
                      placeholder="Korte teaser voor de spotlight..."
                      value={spotlightDescription}
                      onChange={(e) => setSpotlightDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Verberg' : 'Toon'} Preview
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Image Manager - New Multi-Source System */}
        {generatedStoryId && (
            <SpotlightImageManager
              spotlightId={generatedStoryId}
              artistName={artistName}
              discogsId={discogsArtistId}
              onGenerateAI={handleGenerateImages}
              onInsertSelected={handleInsertImages}
              isGeneratingAI={generateImagesMutation.isPending}
            />
        )}

        {/* Preview/Edit Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {showPreview ? 'Preview' : 'Gegenereerde Inhoud'}
            </CardTitle>
            <CardDescription>
              {showPreview 
                ? 'Zo ziet de spotlight eruit voor bezoekers' 
                : 'Bewerk de gegenereerde tekst indien nodig'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!storyContent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Genereer eerst een spotlight om hier de inhoud te zien
                </p>
              </div>
            ) : showPreview ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h1>{artistName}</h1>
                {spotlightDescription && (
                  <p className="lead">{spotlightDescription}</p>
                )}
                <Separator className="my-4" />
                <ReactMarkdown>{storyContent}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Spotlight Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spotlight bestaat al</AlertDialogTitle>
            <AlertDialogDescription>
              Er bestaat al een spotlight voor <strong>{duplicateArtistName}</strong>.
              Wil je toch een nieuwe spotlight aanmaken?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceGenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Toch aanmaken
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
