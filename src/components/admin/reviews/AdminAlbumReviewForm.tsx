import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpotifyAlbumSearch } from "./SpotifyAlbumSearch";

interface ReviewFormData {
  slug: string;
  artist_name: string;
  album_title: string;
  release_year?: number;
  genre?: string;
  label?: string;
  format?: string;
  title: string;
  summary: string;
  content: string;
  rating?: number;
  rating_breakdown?: Record<string, number>;
  cover_image_url?: string;
  spotify_embed_url?: string;
  youtube_embed_url?: string;
  listening_context?: string;
  recommended_for?: string;
  author_name?: string;
  is_published: boolean;
  published_at?: string | null;
}

interface AdminAlbumReviewFormProps {
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AdminAlbumReviewForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AdminAlbumReviewFormProps) => {
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: {
      is_published: initialData?.is_published ?? false,
      format: initialData?.format ?? "lp",
      ...initialData,
    },
  });

  const [ratingAspects, setRatingAspects] = useState<Record<string, number>>(
    initialData?.rating_breakdown || { productie: 8, songwriting: 8, originaliteit: 8 }
  );

  const artistName = watch("artist_name");
  const albumTitle = watch("album_title");

  useEffect(() => {
    if (artistName && albumTitle && !initialData?.slug) {
      const slug = `${artistName}-${albumTitle}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [artistName, albumTitle, initialData, setValue]);

  const handleFormSubmit = (data: ReviewFormData) => {
    // Only set published_at if publishing for the first time
    const published_at = data.is_published 
      ? (initialData?.published_at || new Date().toISOString())
      : null;
    
    onSubmit({
      ...data,
      rating_breakdown: ratingAspects,
      published_at,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basis</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="rating">Rating</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Album Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="artist_name">Artiest *</Label>
                  <Input id="artist_name" {...register("artist_name", { required: true })} />
                  {errors.artist_name && <span className="text-sm text-destructive">Verplicht veld</span>}
                </div>
                <div>
                  <Label htmlFor="album_title">Album *</Label>
                  <Input id="album_title" {...register("album_title", { required: true })} />
                  {errors.album_title && <span className="text-sm text-destructive">Verplicht veld</span>}
                </div>
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" {...register("slug", { required: true })} />
                {errors.slug && <span className="text-sm text-destructive">Verplicht veld</span>}
              </div>

              <div>
                <Label htmlFor="author_name">Auteur</Label>
                <Input 
                  id="author_name" 
                  {...register("author_name")}
                  placeholder="Naam van de recensent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="release_year">Jaar</Label>
                  <Input 
                    id="release_year" 
                    type="number" 
                    {...register("release_year", { valueAsNumber: true })} 
                  />
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select onValueChange={(value) => setValue("format", value)} defaultValue={initialData?.format}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="lp">LP</SelectItem>
                      <SelectItem value="compilation">Compilation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input id="genre" {...register("genre")} />
                </div>
              </div>

              <div>
                <Label htmlFor="label">Label</Label>
                <Input id="label" {...register("label")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Review Titel *</Label>
                <Input id="title" {...register("title", { required: true })} />
                {errors.title && <span className="text-sm text-destructive">Verplicht veld</span>}
              </div>

              <div>
                <Label htmlFor="summary">Samenvatting *</Label>
                <Textarea 
                  id="summary" 
                  rows={3}
                  {...register("summary", { required: true })} 
                  placeholder="Korte intro voor de kaart en preview"
                />
                {errors.summary && <span className="text-sm text-destructive">Verplicht veld</span>}
              </div>

              <div>
                <Label htmlFor="content">Review (Markdown) *</Label>
                <Textarea 
                  id="content" 
                  rows={20}
                  {...register("content", { required: true })}
                  placeholder="Volledige review in markdown format..."
                />
                {errors.content && <span className="text-sm text-destructive">Verplicht veld</span>}
              </div>

              <div>
                <Label htmlFor="listening_context">Luistercontext</Label>
                <Input 
                  id="listening_context" 
                  {...register("listening_context")}
                  placeholder="Eerste luisterbeurt, na 10x draaien, etc."
                />
              </div>

              <div>
                <Label htmlFor="recommended_for">Aanrader voor</Label>
                <Textarea 
                  id="recommended_for" 
                  rows={2}
                  {...register("recommended_for")}
                  placeholder="Fans van..., als je houdt van..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rating">Overall Rating (0-10)</Label>
                <Input 
                  id="rating" 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("rating", { valueAsNumber: true })} 
                />
              </div>

              <div className="space-y-3">
                <Label>Rating Breakdown</Label>
                {Object.entries(ratingAspects).map(([aspect, score]) => (
                  <div key={aspect} className="flex items-center gap-4">
                    <Input 
                      value={aspect}
                      onChange={(e) => {
                        const newAspects = { ...ratingAspects };
                        delete newAspects[aspect];
                        newAspects[e.target.value] = score;
                        setRatingAspects(newAspects);
                      }}
                      className="flex-1"
                    />
                    <Input 
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={score}
                      onChange={(e) => 
                        setRatingAspects({ ...ratingAspects, [aspect]: parseFloat(e.target.value) })
                      }
                      className="w-20"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRatingAspects({ ...ratingAspects, [`aspect${Object.keys(ratingAspects).length + 1}`]: 8 })}
                >
                  + Aspect toevoegen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <SpotifyAlbumSearch
            onSelect={(coverUrl, spotifyUrl) => {
              setValue("cover_image_url", coverUrl);
              setValue("spotify_embed_url", spotifyUrl.replace("album/", "embed/album/"));
            }}
            initialArtist={artistName}
            initialAlbum={albumTitle}
          />

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cover_image_url">Album Cover URL</Label>
                <Input 
                  id="cover_image_url" 
                  {...register("cover_image_url")}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="spotify_embed_url">Spotify Embed URL</Label>
                <Input 
                  id="spotify_embed_url" 
                  {...register("spotify_embed_url")}
                  placeholder="https://open.spotify.com/embed/album/..."
                />
              </div>

              <div>
                <Label htmlFor="youtube_embed_url">YouTube Embed URL</Label>
                <Input 
                  id="youtube_embed_url" 
                  {...register("youtube_embed_url")}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Controller
                name="is_published"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_published"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="is_published">Publiceren</Label>
                  </div>
                )}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
