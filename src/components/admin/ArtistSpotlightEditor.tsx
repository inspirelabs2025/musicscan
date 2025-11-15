import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Save, Eye, Trash2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGenerateSpotlight, useUpdateSpotlight, useArtistSpotlightById, useFormatSpotlight, useDeleteSpotlight, useAddImagesToSpotlight } from "@/hooks/useArtistSpotlight";
import ReactMarkdown from "react-markdown";
import { Separator } from "@/components/ui/separator";

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

  // Only fetch existing story if we're editing (id exists)
  const { data: existingStory, isLoading: loadingStory } = useArtistSpotlightById(id || "", {
    enabled: isEditing
  });
  const generateMutation = useGenerateSpotlight();
  const updateMutation = useUpdateSpotlight();
  const formatMutation = useFormatSpotlight();
  const deleteMutation = useDeleteSpotlight();
  const addImagesMutation = useAddImagesToSpotlight();

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
      setGeneratedStoryId(existingStory.id);
    }
  }, [existingStory]);

  const handleGenerate = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Artiest naam vereist",
        description: "Voer een artiest naam in om te genereren.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(
      { artistName, initialText },
      {
        onSuccess: (data) => {
          // Handle duplicate detection
          if (data?.success === false && data?.code === 'DUPLICATE') {
            toast({
              title: "Spotlight bestaat al",
              description: `Er bestaat al een spotlight voor ${artistName}.`,
              variant: "default",
            });
            // Navigate to existing spotlight for editing
            if (data.existing_id) {
              navigate(`/admin/artist-spotlight/edit/${data.existing_id}`);
            }
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

  const handleAddImages = async () => {
    if (!generatedStoryId) return;

    const confirmed = window.confirm(
      "Dit zal contextual images toevoegen aan de spotlight. De tekst wordt aangepast. Doorgaan?"
    );
    if (!confirmed) return;

    addImagesMutation.mutate(generatedStoryId, {
      onSuccess: (data) => {
        setStoryContent(data.story.story_content);
        toast({
          title: "✨ Afbeeldingen toegevoegd!",
          description: `${data.story.images_added} contextual images zijn toegevoegd.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Fout bij toevoegen afbeeldingen",
          description: error.message || "Er is een fout opgetreden.",
          variant: "destructive",
        });
      },
    });
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
            <Button 
              onClick={handleAddImages}
              disabled={addImagesMutation.isPending}
              variant="outline"
            >
              {addImagesMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              Voeg Afbeeldingen Toe
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
              <Label htmlFor="initialText">Volledige tekst</Label>
              <Textarea
                id="initialText"
                placeholder="Plak hier je volledige tekst (minimaal 100 woorden)..."
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                disabled={isEditing || generateMutation.isPending || formatMutation.isPending}
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
                onClick={handleGenerate} 
                disabled={!artistName.trim() || generateMutation.isPending || formatMutation.isPending || isEditing}
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
                disabled={!artistName.trim() || wordCount < 100 || formatMutation.isPending || generateMutation.isPending || isEditing}
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

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="publish">Publiceren</Label>
                      <p className="text-sm text-muted-foreground">
                        Maak spotlight zichtbaar voor bezoekers
                      </p>
                    </div>
                    <Switch
                      id="publish"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
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
    </div>
  );
};
