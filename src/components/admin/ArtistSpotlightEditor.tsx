import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGenerateSpotlight, useUpdateSpotlight, useArtistSpotlight } from "@/hooks/useArtistSpotlight";
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

  // Only fetch existing story if we're editing (id exists)
  const { data: existingStory, isLoading: loadingStory } = useArtistSpotlight(id || "", {
    enabled: isEditing
  });
  const generateMutation = useGenerateSpotlight();
  const updateMutation = useUpdateSpotlight();

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
        onError: (error) => {
          toast({
            title: "Generatie mislukt",
            description: error.message,
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
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Opslaan
          </Button>
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
              <Label htmlFor="initialText">Initiële Tekst (optioneel)</Label>
              <Textarea
                id="initialText"
                placeholder="Een starttekst of specifieke informatie die je wilt meenemen..."
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                disabled={generateMutation.isPending}
                rows={6}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereren... (30-60 sec)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genereer Spotlight met AI
                </>
              )}
            </Button>

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
