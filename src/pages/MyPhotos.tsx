import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Trash2, Eye, Edit, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyPhotos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery({
    queryKey: ["my-photos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-photos"] });
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

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ photoId, newStatus }: { photoId: string; newStatus: string }) => {
      const updates: any = { status: newStatus };
      
      if (newStatus === "published" && !photos?.find(p => p.id === photoId)?.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("photos")
        .update(updates)
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-photos"] });
      toast({
        title: "Bijgewerkt",
        description: "Status is gewijzigd",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p>Log in om je foto's te bekijken</p>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      published: { variant: "default", text: "Gepubliceerd" },
      draft: { variant: "secondary", text: "Concept" },
      flagged: { variant: "destructive", text: "Gemarkeerd" },
      removed: { variant: "outline", text: "Verwijderd" },
    };
    const config = variants[status] || { variant: "outline", text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mijn Foto's</h1>
            <p className="text-muted-foreground">
              Beheer je geüploade muziek herinneringen
            </p>
          </div>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Nieuwe Foto
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-8">
            <p>Laden...</p>
          </Card>
        ) : photos && photos.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Statistieken</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {photos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell>
                      <img
                        src={photo.display_url}
                        alt={photo.seo_title || ""}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{photo.artist || "Onbekend"}</p>
                        {photo.caption && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {photo.year && (
                            <Badge variant="outline" className="text-xs">
                              {photo.year}
                            </Badge>
                          )}
                          {photo.format && (
                            <Badge variant="outline" className="text-xs">
                              {photo.format}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-sm">
                        <span>❤️ {photo.like_count}</span>
                        <span>💬 {photo.comment_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(photo.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(photo.created_at), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {photo.status === "published" && photo.seo_slug && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/photo/${photo.seo_slug}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {photo.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                photoId: photo.id,
                                newStatus: "published",
                              })
                            }
                          >
                            Publiceer
                          </Button>
                        )}

                        {photo.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                photoId: photo.id,
                                newStatus: "draft",
                              })
                            }
                          >
                            Verberg
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Foto verwijderen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Deze actie kan niet ongedaan worden gemaakt. De foto en alle
                                reacties worden permanent verwijderd.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(photo.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Je hebt nog geen foto's geüpload</p>
            <Button onClick={() => navigate("/upload")}>Upload je eerste foto</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
