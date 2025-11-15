import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Album, Upload, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import {
  useSpotlightImages,
  useUploadSpotlightImage,
  useFetchDiscogsImages,
  useFetchArtistReleases,
  useDeleteSpotlightImage,
  SpotlightImage,
} from "@/hooks/useSpotlightImages";
import { cn } from "@/lib/utils";
import { AlbumSelectionDialog } from "./AlbumSelectionDialog";

interface SpotlightImageManagerProps {
  spotlightId: string;
  artistName: string;
  discogsId?: number;
  onGenerateAI: () => void;
  onInsertSelected: (images: SpotlightImage[]) => void;
  isGeneratingAI: boolean;
}

export const SpotlightImageManager = ({
  spotlightId,
  artistName,
  discogsId,
  onGenerateAI,
  onInsertSelected,
  isGeneratingAI,
}: SpotlightImageManagerProps) => {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [availableAlbums, setAvailableAlbums] = useState<any[]>([]);

  const { data: images = [], isLoading } = useSpotlightImages(spotlightId);
  const uploadMutation = useUploadSpotlightImage();
  const fetchDiscogsMutation = useFetchDiscogsImages();
  const fetchArtistReleasesMutation = useFetchArtistReleases();
  const deleteMutation = useDeleteSpotlightImage();

  const aiImages = images.filter((img) => img.image_source === "ai");
  const discogsImages = images.filter((img) => img.image_source === "discogs");
  const uploadedImages = images.filter((img) => img.image_source === "upload");

  const displayImages =
    activeTab === "all"
      ? images
      : activeTab === "ai"
      ? aiImages
      : activeTab === "discogs"
      ? discogsImages
      : uploadedImages;

  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadMutation.mutateAsync({
        file,
        spotlightId,
        title: `${artistName} - ${file.name}`,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleFetchDiscogs = async () => {
    if (!discogsId) {
      toast({
        title: "Geen Discogs ID",
        description: "Deze spotlight heeft geen Discogs ID.",
        variant: "destructive",
      });
      return;
    }

    // Fetch artist releases
    try {
      const releases = await fetchArtistReleasesMutation.mutateAsync({
        artistId: discogsId,
      });
      setAvailableAlbums(releases);
      setShowAlbumDialog(true);
    } catch (error) {
      console.error("Error fetching releases:", error);
    }
  };

  const handleConfirmAlbums = async (selectedIds: number[]) => {
    await fetchDiscogsMutation.mutateAsync({
      spotlightId,
      discogsIds: selectedIds,
    });
  };

  const handleInsertSelected = () => {
    const selected = images.filter((img) => selectedImages.includes(img.id));
    onInsertSelected(selected);
    setSelectedImages([]);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Weet je zeker dat je deze afbeelding wilt verwijderen?")) {
      return;
    }
    await deleteMutation.mutateAsync({ imageId, spotlightId });
    setSelectedImages((prev) => prev.filter((id) => id !== imageId));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📸 Afbeeldingen Beheer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onGenerateAI}
            disabled={isGeneratingAI}
            variant="default"
          >
            {isGeneratingAI ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Genereer AI Afbeeldingen
          </Button>

          <Button
            onClick={handleFetchDiscogs}
            disabled={!discogsId || fetchDiscogsMutation.isPending}
            variant="outline"
          >
            {fetchDiscogsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Album className="w-4 h-4 mr-2" />
            )}
            Haal Album Covers Op
          </Button>
        </div>

        {/* Upload Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm">Sleep foto's hier...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Sleep foto's hierheen of klik om te uploaden
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG of WEBP (max 5MB per foto)
              </p>
            </>
          )}
          {uploadMutation.isPending && (
            <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin" />
          )}
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Alle ({images.length})
            </TabsTrigger>
            <TabsTrigger value="ai">
              🎨 AI ({aiImages.length})
            </TabsTrigger>
            <TabsTrigger value="discogs">
              💿 Discogs ({discogsImages.length})
            </TabsTrigger>
            <TabsTrigger value="uploaded">
              📸 Upload ({uploadedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {displayImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nog geen afbeeldingen in deze categorie</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayImages.map((img) => (
                  <Card
                    key={img.id}
                    className={cn(
                      "cursor-pointer transition-all overflow-hidden group",
                      selectedImages.includes(img.id) &&
                        "ring-2 ring-primary shadow-lg"
                    )}
                    onClick={() => toggleImageSelection(img.id)}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={img.image_url}
                        alt={img.title || "Spotlight image"}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 text-xs">
                        {img.image_source === "ai" && "🎨 AI"}
                        {img.image_source === "discogs" && "💿 Discogs"}
                        {img.image_source === "upload" && "📸 Upload"}
                      </Badge>
                      {selectedImages.includes(img.id) && (
                        <CheckCircle className="absolute top-2 left-2 text-primary w-6 h-6 fill-current" />
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">
                        {img.title}
                      </p>
                      {img.context && (
                        <p className="text-xs text-muted-foreground truncate">
                          {img.context}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlbumSelectionDialog
          open={showAlbumDialog}
          onOpenChange={setShowAlbumDialog}
          albums={availableAlbums}
          isLoading={fetchArtistReleasesMutation.isPending}
          onConfirm={handleConfirmAlbums}
        />

        {/* Insert Button */}
        {selectedImages.length > 0 && (
          <Button
            onClick={handleInsertSelected}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Voeg {selectedImages.length} Geselecteerde Afbeeldingen Toe
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
