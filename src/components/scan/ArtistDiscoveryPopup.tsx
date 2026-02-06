import { useArtistContent } from '@/hooks/useArtistContent';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer';
import { User, Disc3, Music, BookOpen, Newspaper, ShoppingBag, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArtistDiscoveryPopupProps {
  artistName: string;
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

interface ContentSectionProps {
  icon: React.ReactNode;
  label: string;
  items: { id: string; title: string; slug: string; image_url?: string | null }[];
  routePrefix: string;
}

function ContentSection({ icon, label, items, routePrefix }: ContentSectionProps) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        {label} ({items.length})
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <a
            key={item.id}
            href={`${routePrefix}/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
          >
            {item.image_url && (
              <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
            )}
            <span className="text-sm truncate flex-1">{item.title}</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ArtistDiscoveryPopup({ artistName, isOpen, onClose, onContinue }: ArtistDiscoveryPopupProps) {
  const isMobile = useIsMobile();
  const { artistStory, albumStories, singles, anecdotes, news, products, totalCount, isLoading } = useArtistContent(isOpen ? artistName : null);

  // If loading is done and no content, auto-continue
  if (isOpen && !isLoading && totalCount === 0) {
    // Use setTimeout to avoid state update during render
    setTimeout(onContinue, 0);
    return null;
  }

  const body = isLoading ? (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Content laden voor {artistName}...</p>
    </div>
  ) : (
    <ScrollArea className="max-h-[60vh] pr-2">
      <div className="space-y-4 py-2">
        {artistStory && (
          <ContentSection
            icon={<User className="h-4 w-4" />}
            label="Artiest Verhaal"
            items={[artistStory]}
            routePrefix="/artists"
          />
        )}
        <ContentSection icon={<Disc3 className="h-4 w-4" />} label="Album Verhalen" items={albumStories} routePrefix="/muziek-verhaal" />
        <ContentSection icon={<Music className="h-4 w-4" />} label="Singles" items={singles} routePrefix="/singles" />
        <ContentSection icon={<BookOpen className="h-4 w-4" />} label="Anekdotes" items={anecdotes} routePrefix="/anekdotes" />
        <ContentSection icon={<Newspaper className="h-4 w-4" />} label="Nieuws" items={news} routePrefix="/nieuws" />
        <ContentSection icon={<ShoppingBag className="h-4 w-4" />} label="Shop" items={products} routePrefix="/product" />
      </div>
    </ScrollArea>
  );

  const footer = (
    <div className="flex gap-3 w-full">
      <Button variant="outline" onClick={onClose} className="flex-1">
        Sluiten
      </Button>
      <Button onClick={onContinue} className="flex-1 gap-2">
        Nieuwe scan starten
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Ontdek meer over {artistName}
            </DrawerTitle>
            <DrawerDescription>
              Wij hebben {totalCount} items gevonden op MusicScan
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-2">{body}</div>
          <DrawerFooter>{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Ontdek meer over {artistName}
          </DialogTitle>
          <DialogDescription>
            Wij hebben {totalCount} items gevonden op MusicScan
          </DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter className="sm:flex-row gap-3">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
