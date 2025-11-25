import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAdminAlbumReviews } from "@/hooks/useAdminAlbumReviews";
import { AdminAlbumReviewForm } from "@/components/admin/reviews/AdminAlbumReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
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

export default function AdminAlbumReviews() {
  const { reviews, isLoading, createReview, updateReview, deleteReview } = useAdminAlbumReviews();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    await createReview.mutateAsync(data);
    setIsCreating(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingId) {
      await updateReview.mutateAsync({ ...data, id: editingId });
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReview.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isCreating || editingId) {
    const reviewToEdit = reviews?.find(r => r.id === editingId);
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">
                {isCreating ? "Nieuwe Review" : "Review Bewerken"}
              </h1>
            </div>
            <AdminAlbumReviewForm
              initialData={reviewToEdit}
              onSubmit={isCreating ? handleCreate : handleUpdate}
              onCancel={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              isSubmitting={createReview.isPending || updateReview.isPending}
            />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Album Reviews</h1>
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nieuwe Review
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {review.artist_name} - {review.album_title}
                          {review.is_published ? (
                            <Badge variant="default">Gepubliceerd</Badge>
                          ) : (
                            <Badge variant="secondary">Concept</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.title}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {review.is_published && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/reviews/${review.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(review.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.genre && <Badge variant="secondary">{review.genre}</Badge>}
                      {review.format && <Badge variant="outline">{review.format.toUpperCase()}</Badge>}
                      {review.release_year && <Badge variant="outline">{review.release_year}</Badge>}
                      {review.rating && (
                        <Badge variant="default">⭐ {review.rating}/10</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.summary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Nog geen reviews aangemaakt</p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Maak je eerste review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Review verwijderen?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze actie kan niet ongedaan gemaakt worden. De review wordt permanent verwijderd.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Verwijderen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
