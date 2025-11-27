import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Save,
  Image as ImageIcon,
  FileText,
  Send
} from 'lucide-react';
import type { MediaLibraryItem, ProductType } from '@/hooks/useMediaLibrary';

interface MediaLibraryDetailProps {
  item: MediaLibraryItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (params: { id: string; updates: Partial<MediaLibraryItem> }) => Promise<void>;
  onAnalyze: (item: MediaLibraryItem) => void;
  onSendToQueue: (params: { items: MediaLibraryItem[]; productType: ProductType }) => Promise<{ items: MediaLibraryItem[]; productType: ProductType }>;
  isAnalyzing: boolean;
}

const productTypes: { key: ProductType; label: string; emoji: string }[] = [
  { key: 'posters', label: 'Posters', emoji: '🖼️' },
  { key: 'socks', label: 'Sokken', emoji: '🧦' },
  { key: 'buttons', label: 'Buttons', emoji: '🔘' },
  { key: 'tshirts', label: 'T-Shirts', emoji: '👕' },
  { key: 'fanwall', label: 'FanWall', emoji: '📸' },
  { key: 'canvas', label: 'Canvas', emoji: '🎨' },
];

export const MediaLibraryDetail = ({
  item,
  open,
  onClose,
  onUpdate,
  onAnalyze,
  onSendToQueue,
  isAnalyzing
}: MediaLibraryDetailProps) => {
  const [manualArtist, setManualArtist] = useState(item?.manual_artist || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ 
        id: item.id, 
        updates: {
          manual_artist: manualArtist || null,
          notes: notes || null
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTo = async (productType: ProductType) => {
    await onSendToQueue({ items: [item], productType });
  };

  const artistName = manualArtist || item.manual_artist || item.recognized_artist;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Media Library Detail
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image preview */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={item.public_url}
                alt={item.file_name}
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Bestand:</strong> {item.file_name}</p>
              <p><strong>Grootte:</strong> {item.file_size ? `${Math.round(item.file_size / 1024)} KB` : 'Onbekend'}</p>
              <p><strong>Type:</strong> {item.mime_type || 'Onbekend'}</p>
              <p><strong>Geüpload:</strong> {new Date(item.created_at).toLocaleString('nl-NL')}</p>
            </div>
          </div>

          {/* Details and actions */}
          <div className="space-y-6">
            {/* AI Recognition Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">AI Herkenning</h3>
                <Badge variant={
                  item.ai_status === 'completed' ? 'default' :
                  item.ai_status === 'failed' ? 'destructive' :
                  'secondary'
                }>
                  {item.ai_status}
                </Badge>
              </div>

              {item.ai_status === 'pending' && (
                <Button 
                  onClick={() => onAnalyze(item)}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Analyse
                </Button>
              )}

              {item.ai_status === 'completed' && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Herkende artiest:</span>
                    <span className="font-medium">{item.recognized_artist || 'Geen'}</span>
                  </div>
                  {item.artist_confidence && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Zekerheid:</span>
                      <span className="font-medium">{Math.round(item.artist_confidence * 100)}%</span>
                    </div>
                  )}
                  {item.ai_context_type && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Context:</span>
                      <span className="font-medium">{item.ai_context_type}</span>
                    </div>
                  )}
                  {item.ai_tags && item.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {item.ai_tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {item.ai_reasoning && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{item.ai_reasoning}"
                    </p>
                  )}
                  {item.alternative_artists && item.alternative_artists.length > 0 && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground">Alternatieven: </span>
                      <span className="text-sm">{item.alternative_artists.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Manual Override */}
            <div className="space-y-3">
              <h3 className="font-semibold">Handmatige Override</h3>
              <div className="space-y-2">
                <Label htmlFor="manual-artist">Artiest naam</Label>
                <Input
                  id="manual-artist"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  placeholder={item.recognized_artist || 'Voer artiest naam in...'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele notities..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Opslaan
              </Button>
            </div>

            <Separator />

            {/* Send to Product Queues */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" />
                Verstuur naar Product Generator
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {productTypes.map((pt) => {
                  const isSent = item[`sent_to_${pt.key}` as keyof MediaLibraryItem];
                  return (
                    <Button
                      key={pt.key}
                      variant={isSent ? "secondary" : "outline"}
                      onClick={() => handleSendTo(pt.key)}
                      disabled={!!isSent}
                      className="justify-start"
                    >
                      <span className="mr-2">{pt.emoji}</span>
                      {pt.label}
                      {isSent && <Badge variant="outline" className="ml-auto text-xs">Verstuurd</Badge>}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Artiest: <strong>{artistName || 'Niet ingesteld'}</strong>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
