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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useMediaLibrary, type MediaLibraryItem, type ProductType } from '@/hooks/useMediaLibrary';
import { usePhotoBatchProcessor } from '@/hooks/usePhotoBatchProcessor';
import { MediaLibraryUploader } from '@/components/admin/MediaLibraryUploader';
import { MediaLibraryGrid } from '@/components/admin/MediaLibraryGrid';
import { MediaLibraryDetail } from '@/components/admin/MediaLibraryDetail';
import { SendToQueueDialog } from '@/components/admin/SendToQueueDialog';
import { supabase } from '@/integrations/supabase/client';

const productTypes: { key: ProductType; label: string; emoji: string }[] = [
  { key: 'stylizer', label: 'Photo Stylizer', emoji: '✨' },
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
  
  const { startBatch, isProcessing: isStylizerProcessing } = usePhotoBatchProcessor();

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

  // Open send dialog or start stylizer batch automatically
  const handleOpenSendDialog = async (productType: ProductType) => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) {
      toast({
        title: 'Geen selectie',
        description: 'Selecteer eerst items om te versturen',
        variant: 'destructive'
      });
      return;
    }
    
    // For stylizer, start batch processing automatically without navigation
    if (productType === 'stylizer') {
      if (selectedItems.length > 1) {
        toast({
          title: 'Te veel geselecteerd',
          description: 'Photo Stylizer ondersteunt slechts 1 foto tegelijk',
          variant: 'destructive'
        });
        return;
      }
      
      const item = selectedItems[0];
      const artistName = item.manual_artist || item.recognized_artist || 'Onbekende Artiest';
      const title = artistName; // Use artist name as title, not filename
      
      try {
        // Start batch processing automatically
        await startBatch(
          item.public_url,
          artistName,
          title,
          `Automatisch gegenereerd vanuit Media Library`
        );
        
        // Mark as sent to queue
        await sendToQueue({ items: [item], productType: 'posters' });
        
        // Clear selection
        setSelectedIds([]);
        
      } catch (error) {
        console.error('Stylizer batch failed:', error);
      }
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
    // Handle FanWall creation
    if (productType === 'fanwall' && options?.artistName) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Fout',
            description: 'Je moet ingelogd zijn om foto\'s toe te voegen aan de FanWall',
            variant: 'destructive'
          });
          return;
        }

        let fanwallId = options.fanwallId;
        
        // Create new fanwall if needed
        if (options.createNewFanwall) {
          const slug = options.artistName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          const { data: newFanwall, error: fanwallError } = await supabase
            .from('artist_fanwalls')
            .insert({
              artist_name: options.artistName,
              slug: slug,
              photo_count: 0,
              is_active: true,
              seo_title: `${options.artistName} FanWall - Fan Photos & Memories | MusicScan`,
              seo_description: `Ontdek ${options.artistName} fan foto's: live concerten, vinyl collecties, en meer. Deel jouw ${options.artistName} herinneringen!`,
              canonical_url: `https://www.musicscan.app/fanwall/${slug}`
            })
            .select()
            .single();
          
          if (fanwallError) {
            // Maybe fanwall already exists, try to find it
            const { data: existingFanwall } = await supabase
              .from('artist_fanwalls')
              .select('id')
              .eq('slug', slug)
              .single();
            
            if (existingFanwall) {
              fanwallId = existingFanwall.id;
            } else {
              throw fanwallError;
            }
          } else {
            fanwallId = newFanwall.id;
          }
        }

        // Create photo entries for each selected item
        let successCount = 0;
        for (const item of selectedItems) {
          const photoSlug = `${options.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const { error: photoError } = await supabase
            .from('photos')
            .insert({
              user_id: user.id,
              source_type: 'media_library',
              original_url: item.public_url,
              display_url: item.thumbnail_url || item.public_url,
              artist: options.artistName,
              caption: `${options.artistName} - Uploaded from Media Library`,
              status: 'published',
              seo_slug: photoSlug,
              seo_title: `${options.artistName} Fan Photo | MusicScan FanWall`,
              seo_description: `${options.artistName} fan foto gedeeld door een MusicScan gebruiker.`,
              published_at: new Date().toISOString(),
              license_granted: true,
              print_allowed: false
            });
          
          if (!photoError) {
            successCount++;
          } else {
            console.error('Failed to create photo:', photoError);
          }
        }

        // Update fanwall photo count
        if (fanwallId) {
          const { data: currentFanwall } = await supabase
            .from('artist_fanwalls')
            .select('photo_count, featured_photo_url')
            .eq('id', fanwallId)
            .single();
          
          const newCount = (currentFanwall?.photo_count || 0) + successCount;
          const updateData: any = { photo_count: newCount };
          
          // Set featured photo if not set
          if (!currentFanwall?.featured_photo_url && selectedItems.length > 0) {
            updateData.featured_photo_url = selectedItems[0].public_url;
          }
          
          await supabase
            .from('artist_fanwalls')
            .update(updateData)
            .eq('id', fanwallId);
        }

        toast({
          title: 'FanWall bijgewerkt',
          description: `${successCount} foto('s) toegevoegd aan de FanWall van ${options.artistName}`
        });
      } catch (error) {
        console.error('FanWall creation error:', error);
        toast({
          title: 'Fout',
          description: 'Er ging iets mis bij het aanmaken van de FanWall',
          variant: 'destructive'
        });
        return;
      }
    }

    // Mark items as sent
    await sendToQueue({ items: selectedItems, productType });
    setSelectedIds([]);
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
                  variant={pt.key === 'stylizer' ? 'default' : 'outline'}
                  onClick={() => handleOpenSendDialog(pt.key)}
                  disabled={isSendingToQueue || (pt.key === 'stylizer' && isStylizerProcessing)}
                >
                  {pt.key === 'stylizer' && isStylizerProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
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
