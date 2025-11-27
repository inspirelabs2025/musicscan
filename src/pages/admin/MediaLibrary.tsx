import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  CloudUpload, 
  Search, 
  Sparkles,
  Image as ImageIcon,
  Send,
  RefreshCw
} from 'lucide-react';
import { useMediaLibrary, type MediaLibraryItem, type ProductType } from '@/hooks/useMediaLibrary';
import { MediaLibraryUploader } from '@/components/admin/MediaLibraryUploader';
import { MediaLibraryGrid } from '@/components/admin/MediaLibraryGrid';
import { MediaLibraryDetail } from '@/components/admin/MediaLibraryDetail';
import { SendToQueueDialog } from '@/components/admin/SendToQueueDialog';

const productTypes: { key: ProductType; label: string; emoji: string }[] = [
  { key: 'posters', label: 'Posters', emoji: '🖼️' },
  { key: 'socks', label: 'Sokken', emoji: '🧦' },
  { key: 'buttons', label: 'Buttons', emoji: '🔘' },
  { key: 'tshirts', label: 'T-Shirts', emoji: '👕' },
  { key: 'fanwall', label: 'FanWall', emoji: '📸' },
  { key: 'canvas', label: 'Canvas', emoji: '🎨' },
];

const MediaLibrary = () => {
  const { toast } = useToast();
  const {
    items,
    isLoading,
    refetch,
    uploadImage,
    isUploading,
    analyzeImage,
    isAnalyzing,
    updateItem,
    deleteItem,
    sendToQueue,
    isSendingToQueue
  } = useMediaLibrary();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingItem, setViewingItem] = useState<MediaLibraryItem | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogProductType, setSendDialogProductType] = useState<ProductType>('fanwall');

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        await uploadImage(file);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    toast({
      title: 'Upload voltooid',
      description: `${files.length} bestand(en) geüpload`
    });
  };

  // Analyze all pending
  const handleAnalyzeAll = async () => {
    const pendingItems = items.filter(i => i.ai_status === 'pending');
    for (const item of pendingItems) {
      try {
        await analyzeImage(item);
      } catch (error) {
        console.error('Analysis error:', error);
      }
    }
  };

  // Open send dialog
  const handleOpenSendDialog = (productType: ProductType) => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) {
      toast({
        title: 'Geen selectie',
        description: 'Selecteer eerst items om te versturen',
        variant: 'destructive'
      });
      return;
    }
    setSendDialogProductType(productType);
    setSendDialogOpen(true);
  };

  // Confirm send to queue
  const handleConfirmSendToQueue = async (
    selectedItems: MediaLibraryItem[], 
    productType: ProductType,
    options?: { artistName?: string; fanwallId?: string; createNewFanwall?: boolean }
  ) => {
    await sendToQueue({ items: selectedItems, productType });
    setSelectedIds([]);
    // TODO: Handle fanwall creation/selection with options
    if (options?.createNewFanwall && options.artistName) {
      toast({
        title: 'FanWall',
        description: `Nieuwe FanWall voor ${options.artistName} wordt aangemaakt wanneer de foto's worden verwerkt.`
      });
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recognized_artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manual_artist?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.ai_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: items.length,
    pending: items.filter(i => i.ai_status === 'pending').length,
    completed: items.filter(i => i.ai_status === 'completed').length,
    withArtist: items.filter(i => i.recognized_artist || i.manual_artist).length
  };

  const selectedItems = items.filter(i => selectedIds.includes(i.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CloudUpload className="h-8 w-8" />
            Cloud Storage Box
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload foto's en laat AI de artiesten herkennen
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Vernieuwen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Totaal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Geanalyseerd</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="h-8 w-8 flex items-center justify-center text-xs">AI</Badge>
              <div>
                <p className="text-2xl font-bold">{stats.withArtist}</p>
                <p className="text-sm text-muted-foreground">Met artiest</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Wachtend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Foto's</CardTitle>
          <CardDescription>
            Sleep foto's naar het uploadvak of klik om bestanden te selecteren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibraryUploader onUpload={handleUpload} isUploading={isUploading} />
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam of artiest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="pending">Wachtend</SelectItem>
                <SelectItem value="analyzing">Analyseren</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="failed">Mislukt</SelectItem>
              </SelectContent>
            </Select>

            {stats.pending > 0 && (
              <Button 
                onClick={handleAnalyzeAll}
                disabled={isAnalyzing}
                variant="secondary"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analyseer alles ({stats.pending})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">{selectedIds.length} geselecteerd</span>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Send className="h-4 w-4" />
                Verstuur naar:
              </span>
              {productTypes.map((pt) => (
                <Button
                  key={pt.key}
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenSendDialog(pt.key)}
                  disabled={isSendingToQueue}
                >
                  {pt.emoji} {pt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <MediaLibraryGrid
              items={filteredItems}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onAnalyze={analyzeImage}
              onView={setViewingItem}
              onDelete={deleteItem}
              isAnalyzing={isAnalyzing}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <MediaLibraryDetail
        item={viewingItem}
        open={!!viewingItem}
        onClose={() => setViewingItem(null)}
        onUpdate={updateItem}
        onAnalyze={analyzeImage}
        onSendToQueue={sendToQueue}
        isAnalyzing={isAnalyzing}
      />

      {/* Send to Queue Dialog */}
      <SendToQueueDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        items={items.filter(i => selectedIds.includes(i.id))}
        productType={sendDialogProductType}
        onConfirm={handleConfirmSendToQueue}
        isLoading={isSendingToQueue}
      />
    </div>
  );
};

export default MediaLibrary;
