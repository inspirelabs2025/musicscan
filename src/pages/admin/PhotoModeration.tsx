import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Eye, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ModerationItem {
  id: string;
  photo_id: string;
  reason: string;
  created_at: string;
  photos: {
    id: string;
    display_url: string;
    seo_slug: string;
    artist: string | null;
    caption: string | null;
    status: string;
    flagged_count: number;
  };
}

export default function PhotoModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ["photo-moderation-queue"],
    queryFn: async () => {
      // First get all flagged photos
      const { data: flaggedPhotos, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .eq("status", "flagged")
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;

      // Return in the format expected by the UI
      return flaggedPhotos?.map(photo => ({
        id: photo.id,
        photo_id: photo.id,
        reason: `Flagged ${photo.flagged_count} times`,
        created_at: photo.created_at,
        photos: {
          id: photo.id,
          display_url: photo.display_url,
          seo_slug: photo.seo_slug,
          artist: photo.artist,
          caption: photo.caption,
          status: photo.status,
          flagged_count: photo.flagged_count,
        }
      })) || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("photos")
        .update({ 
          status: "published",
          flagged_count: 0,
          published_at: new Date().toISOString()
        })
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-moderation-queue"] });
      toast({
        title: "Goedgekeurd",
        description: "Foto is goedgekeurd en gepubliceerd",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon foto niet goedkeuren",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("photos")
        .update({ status: "removed" })
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-moderation-queue"] });
      toast({
        title: "Verwijderd",
        description: "Foto is verwijderd",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon foto niet verwijderen",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Photo Moderatie</h1>
          <p className="text-muted-foreground">
            Review gemarkeerde foto's en keur goed of verwijder
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8">
            <p>Laden...</p>
          </Card>
        ) : queue && queue.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Markering Count</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item: ModerationItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.photos.display_url}
                        alt=""
                        className="w-24 h-24 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {item.photos.artist || "Onbekend"}
                        </p>
                        {item.photos.caption && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.photos.caption}
                          </p>
                        )}
                        <Badge variant="destructive" className="mt-2">
                          {item.photos.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Flag className="h-3 w-3 mr-1" />
                        {item.photos.flagged_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.photos.seo_slug && (
                          <Link to={`/photo/${item.photos.seo_slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveMutation.mutate(item.photo_id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectMutation.mutate(item.photo_id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Geen foto's in de moderatie queue</p>
          </Card>
        )}
      </div>
    </div>
  );
}
