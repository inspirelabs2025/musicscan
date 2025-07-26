import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollectionItemCard } from '@/components/CollectionItemCard';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import { Loader2 } from 'lucide-react';

const PublicCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'cd' | 'vinyl'>('all');
  const { items, isLoading } = usePublicCatalog();

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.label?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = formatFilter === 'all' || item.media_type === formatFilter;
    
    return matchesSearch && matchesFormat;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Openbare Catalogus</h1>
          <p className="text-muted-foreground">
            Ontdek CD's en LP's uit openbare collecties en winkels
          </p>
          <div className="flex gap-4 mt-4">
            <Badge variant="secondary">
              {filteredItems.length} items gevonden
            </Badge>
            <Badge variant="outline">
              {items.filter(item => item.is_for_sale).length} te koop
            </Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op artiest, titel of label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'cd', 'vinyl'] as const).map((format) => (
              <Button
                key={format}
                variant={formatFilter === format ? 'default' : 'outline'}
                onClick={() => setFormatFilter(format)}
                className="capitalize"
              >
                {format === 'all' ? 'Alle' : format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? 'Geen items gevonden voor deze zoekopdracht.' : 'Geen openbare items beschikbaar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <CollectionItemCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                onUpdate={() => {}}
                showControls={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCatalog;