import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaLibraryItem } from '@/hooks/useMediaLibrary';

interface MediaLibraryGridProps {
  items: MediaLibraryItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAnalyze: (item: MediaLibraryItem) => void;
  onView: (item: MediaLibraryItem) => void;
  onDelete: (item: MediaLibraryItem) => void;
  isAnalyzing: boolean;
}

const statusIcons = {
  pending: Clock,
  analyzing: Sparkles,
  completed: CheckCircle2,
  failed: AlertCircle
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  analyzing: 'bg-primary/20 text-primary',
  completed: 'bg-green-500/20 text-green-600',
  failed: 'bg-destructive/20 text-destructive'
};

export const MediaLibraryGrid = ({
  items,
  selectedIds,
  onSelectionChange,
  onAnalyze,
  onView,
  onDelete,
  isAnalyzing
}: MediaLibraryGridProps) => {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(i => i.id));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Geen foto's in de media library</p>
        <p className="text-sm mt-1">Upload foto's om te beginnen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selectedIds.length === items.length && items.length > 0}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0 
              ? `${selectedIds.length} geselecteerd` 
              : `${items.length} foto's`
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => {
          const StatusIcon = statusIcons[item.ai_status];
          const isSelected = selectedIds.includes(item.id);
          const artistName = item.manual_artist || item.recognized_artist;
          
          return (
            <Card 
              key={item.id}
              className={cn(
                "relative overflow-hidden group cursor-pointer transition-all",
                isSelected && "ring-2 ring-primary"
              )}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(item.id)}
                  className="bg-background/80"
                />
              </div>

              {/* Status badge */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className={cn("text-xs", statusColors[item.ai_status])}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {item.ai_status === 'analyzing' && 'Analyzing...'}
                  {item.ai_status === 'pending' && 'Pending'}
                  {item.ai_status === 'completed' && (
                    item.artist_confidence 
                      ? `${Math.round(item.artist_confidence * 100)}%`
                      : 'Done'
                  )}
                  {item.ai_status === 'failed' && 'Failed'}
                </Badge>
              </div>

              {/* Image */}
              <div 
                className="aspect-square bg-muted"
                onClick={() => onView(item)}
              >
                <img
                  src={item.thumbnail_url || item.public_url}
                  alt={item.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info overlay */}
              <div className="p-3 bg-card">
                <p className="font-medium truncate text-sm">
                  {artistName || 'Onbekende artiest'}
                </p>
                {item.ai_context_type && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.ai_context_type}
                  </p>
                )}

                {/* Sent indicators */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.sent_to_posters && <Badge variant="outline" className="text-xs">Poster</Badge>}
                  {item.sent_to_socks && <Badge variant="outline" className="text-xs">Sokken</Badge>}
                  {item.sent_to_buttons && <Badge variant="outline" className="text-xs">Buttons</Badge>}
                  {item.sent_to_tshirts && <Badge variant="outline" className="text-xs">T-Shirt</Badge>}
                  {item.sent_to_fanwall && <Badge variant="outline" className="text-xs">FanWall</Badge>}
                  {item.sent_to_canvas && <Badge variant="outline" className="text-xs">Canvas</Badge>}
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                  title="Bewerken"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {item.ai_status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyze(item);
                    }}
                    disabled={isAnalyzing}
                    title="AI Analyse"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
