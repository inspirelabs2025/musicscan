import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface Album {
  id: number;
  title: string;
  year: number;
  thumb: string;
  coverImage: string;
  type: string;
}

interface AlbumSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albums: Album[];
  isLoading: boolean;
  onConfirm: (selectedIds: number[]) => void;
}

export const AlbumSelectionDialog = ({
  open,
  onOpenChange,
  albums,
  isLoading,
  onConfirm,
}: AlbumSelectionDialogProps) => {
  const [selectedAlbums, setSelectedAlbums] = useState<number[]>([]);

  const toggleAlbum = (albumId: number) => {
    setSelectedAlbums((prev) =>
      prev.includes(albumId)
        ? prev.filter((id) => id !== albumId)
        : [...prev, albumId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedAlbums);
    setSelectedAlbums([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecteer Albums</DialogTitle>
          <DialogDescription>
            Kies welke albums je wilt ophalen van Discogs
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => toggleAlbum(album.id)}
                  >
                    <Checkbox
                      checked={selectedAlbums.includes(album.id)}
                      onCheckedChange={() => toggleAlbum(album.id)}
                    />
                    <div className="flex-1 min-w-0">
                      {album.thumb && (
                        <img
                          src={album.thumb}
                          alt={album.title}
                          className="w-full aspect-square object-cover rounded mb-2"
                        />
                      )}
                      <p className="font-medium text-sm line-clamp-2">
                        {album.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {album.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedAlbums.length} album{selectedAlbums.length !== 1 ? "s" : ""}{" "}
                geselecteerd
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedAlbums.length === 0}
                >
                  Ophalen
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
