import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import type { MediaLibraryItem, ProductType } from '@/hooks/useMediaLibrary';

interface SendToQueueDialogProps {
  open: boolean;
  onClose: () => void;
  items: MediaLibraryItem[];
  productType: ProductType;
  onConfirm: (items: MediaLibraryItem[], productType: ProductType, options?: {
    artistName?: string;
    fanwallId?: string;
    createNewFanwall?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

const productLabels: Record<ProductType, string> = {
  posters: 'Posters',
  socks: 'Sokken',
  buttons: 'Buttons',
  tshirts: 'T-Shirts',
  fanwall: 'FanWall',
  canvas: 'Canvas',
  stylizer: 'Photo Stylizer',
};

export const SendToQueueDialog = ({
  open,
  onClose,
  items,
  productType,
  onConfirm,
  isLoading
}: SendToQueueDialogProps) => {
  // Get detected artist from first item
  const detectedArtist = items[0]?.manual_artist || items[0]?.recognized_artist || '';
  const [artistName, setArtistName] = useState(detectedArtist);
  const [selectedFanwallId, setSelectedFanwallId] = useState<string>('new');
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const detected = items[0]?.manual_artist || items[0]?.recognized_artist || '';
      setArtistName(detected);
      setSelectedFanwallId('new');
    }
  }, [open, items]);

  // Fetch existing fanwalls
  const { data: fanwalls = [] } = useQuery({
    queryKey: ['fanwalls-for-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_fanwalls')
        .select('id, artist_name, slug, photo_count')
        .eq('is_active', true)
        .order('artist_name');
      
      if (error) throw error;
      return data;
    },
    enabled: open && productType === 'fanwall'
  });

  // Find matching fanwall based on artist name
  useEffect(() => {
    if (artistName && fanwalls.length > 0) {
      const match = fanwalls.find(
        f => f.artist_name.toLowerCase() === artistName.toLowerCase()
      );
      if (match) {
        setSelectedFanwallId(match.id);
      } else {
        setSelectedFanwallId('new');
      }
    }
  }, [artistName, fanwalls]);

  const handleConfirm = async () => {
    await onConfirm(items, productType, {
      artistName: artistName || undefined,
      fanwallId: selectedFanwallId !== 'new' ? selectedFanwallId : undefined,
      createNewFanwall: productType === 'fanwall' && selectedFanwallId === 'new'
    });
    onClose();
  };

  const selectedFanwall = fanwalls.find(f => f.id === selectedFanwallId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Versturen naar {productLabels[productType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview of items */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {items.slice(0, 5).map((item) => (
              <div 
                key={item.id} 
                className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted"
              >
                <img 
                  src={item.thumbnail_url || item.public_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {items.length > 5 && (
              <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">+{items.length - 5}</span>
              </div>
            )}
          </div>

          {/* Artist name */}
          <div className="space-y-2">
            <Label htmlFor="artist">Artiest naam</Label>
            <div className="flex gap-2">
              <Input
                id="artist"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Voer artiest naam in..."
              />
              {items[0]?.recognized_artist && (
                <Badge variant="secondary" className="whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>
            {items[0]?.artist_confidence && (
              <p className="text-xs text-muted-foreground">
                AI confidence: {Math.round(items[0].artist_confidence * 100)}%
              </p>
            )}
          </div>

          {/* FanWall specific: select or create */}
          {productType === 'fanwall' && (
            <div className="space-y-2">
              <Label>FanWall</Label>
              <Select value={selectedFanwallId} onValueChange={setSelectedFanwallId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer FanWall..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nieuwe FanWall aanmaken
                    </span>
                  </SelectItem>
                  {fanwalls.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      <span className="flex items-center gap-2">
                        {fw.artist_name}
                        <Badge variant="outline" className="text-xs">
                          {fw.photo_count} foto's
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedFanwallId === 'new' && artistName && (
                <p className="text-sm text-muted-foreground">
                  Er wordt een nieuwe FanWall aangemaakt voor "{artistName}"
                </p>
              )}
              {selectedFanwall && (
                <p className="text-sm text-muted-foreground">
                  Foto's worden toegevoegd aan bestaande FanWall van {selectedFanwall.artist_name}
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-sm">
              <strong>{items.length}</strong> foto{items.length !== 1 ? "'s" : ''} 
              {' '}worden verstuurd naar <strong>{productLabels[productType]}</strong>
              {artistName && (
                <> voor artiest <strong>{artistName}</strong></>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || (productType === 'fanwall' && !artistName)}>
            {isLoading ? 'Bezig...' : 'Versturen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
