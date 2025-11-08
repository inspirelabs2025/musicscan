import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, RefreshCw } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useBulkPosterUpload } from "@/hooks/useBulkPosterUpload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BulkPosterUpload = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const { uploadPosters, isUploading } = useBulkPosterUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  // Fetch queue stats
  const { data: queueStats, isLoading: statsLoading } = useQuery({
    queryKey: ['poster-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poster_processing_queue')
        .select('status, id')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const stats = {
        pending: data.filter(i => i.status === 'pending').length,
        processing: data.filter(i => i.status === 'processing').length,
        completed: data.filter(i => i.status === 'completed').length,
        failed: data.filter(i => i.status === 'failed').length,
        total: data.length
      };

      return stats;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch queue items
  const { data: queueItems } = useQuery({
    queryKey: ['poster-queue-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poster_processing_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Geen bestanden geselecteerd");
      return;
    }

    await uploadPosters(files);
    setFiles([]);
    queryClient.invalidateQueries({ queryKey: ['poster-queue-stats'] });
    queryClient.invalidateQueries({ queryKey: ['poster-queue-items'] });
  };

  const handleRetryFailed = async () => {
    const { error } = await supabase
      .from('poster_processing_queue')
      .update({ status: 'pending', retry_count: 0, error_message: null })
      .eq('status', 'failed');

    if (error) {
      toast.error("Retry failed: " + error.message);
    } else {
      toast.success("Mislukte items opnieuw in queue geplaatst");
      queryClient.invalidateQueries({ queryKey: ['poster-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['poster-queue-items'] });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/photo-stylizer')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Terug naar Photo Stylizer
      </Button>

      <h1 className="text-3xl font-bold mb-6">Bulk Poster Upload</h1>

      {/* Upload Section */}
      <Card className="p-6 mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">
            {isDragActive ? 'Drop de bestanden hier...' : 'Sleep foto\'s hierheen of klik om te selecteren'}
          </p>
          <p className="text-sm text-muted-foreground">
            Bestandsnaam = Artiestnaam (bijv. "Beyoncé.jpg")
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Geselecteerde bestanden: {files.length}</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <div key={idx} className="text-sm flex justify-between">
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">
                    {file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                {isUploading ? 'Uploaden...' : 'Start Bulk Processing'}
              </Button>
              <Button variant="outline" onClick={() => setFiles([])}>
                Wissen
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      {!statsLoading && queueStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{queueStats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-500">{queueStats.processing}</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-500">{queueStats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-500">{queueStats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{queueStats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </Card>
        </div>
      )}

      {/* Actions */}
      {queueStats && queueStats.failed > 0 && (
        <div className="mb-4">
          <Button onClick={handleRetryFailed} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Failed ({queueStats.failed})
          </Button>
        </div>
      )}

      {/* Queue Items List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Queue Items</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {queueItems?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{item.artist_name}</div>
                <div className="text-sm text-muted-foreground">{item.storage_path}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'failed' ? 'bg-red-100 text-red-800' :
                  item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </div>
                {item.retry_count > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Retry: {item.retry_count}/3
                  </div>
                )}
                {item.product_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/product/${item.product_id}`)}
                  >
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BulkPosterUpload;
