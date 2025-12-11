import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Music, Headphones, Disc, ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface GiftItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price_range: string;
  image_url: string | null;
  product_ids: string[] | null;
  external_links: { name: string; url: string }[] | null;
}

const DEFAULT_GIFTS: GiftItem[] = [
  {
    id: '1',
    title: 'Vinyl Platenspeler',
    description: 'Een hoogwaardige platenspeler voor de vinyl liefhebber. Perfect voor het afspelen van klassieke kerstplaten.',
    category: 'audio',
    price_range: '€100-300',
    image_url: null,
    product_ids: null,
    external_links: [{ name: 'Bekijk op Bol.com', url: 'https://bol.com' }]
  },
  {
    id: '2',
    title: 'Bluetooth Speaker',
    description: 'Draagbare speaker voor kerstmuziek door het hele huis. Krachtig geluid in compact formaat.',
    category: 'audio',
    price_range: '€50-150',
    image_url: null,
    product_ids: null,
    external_links: null
  },
  {
    id: '3',
    title: 'MusicScan Art Print',
    description: 'Unieke kunstprint van je favoriete album. Perfect als decoratie voor de muziekliefhebber.',
    category: 'merch',
    price_range: '€49.95',
    image_url: null,
    product_ids: null,
    external_links: null
  },
  {
    id: '4',
    title: 'Kerst Vinyl Box Set',
    description: 'Verzameling van de beste kerstplaten op vinyl. Van Bing Crosby tot Mariah Carey.',
    category: 'vinyl',
    price_range: '€50-100',
    image_url: null,
    product_ids: null,
    external_links: null
  },
  {
    id: '5',
    title: 'Studio Koptelefoon',
    description: 'High-end koptelefoon voor de ultieme luisterervaring. Hoor elk detail van je favoriete muziek.',
    category: 'audio',
    price_range: '€150-400',
    image_url: null,
    product_ids: null,
    external_links: null
  },
  {
    id: '6',
    title: 'Album T-shirt',
    description: 'Stijlvol t-shirt met album artwork. Draag je favoriete muziek!',
    category: 'merch',
    price_range: '€24.95',
    image_url: null,
    product_ids: null,
    external_links: null
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Alles', icon: <Gift className="h-4 w-4" /> },
  { id: 'audio', label: 'Audio', icon: <Headphones className="h-4 w-4" /> },
  { id: 'vinyl', label: 'Vinyl', icon: <Disc className="h-4 w-4" /> },
  { id: 'merch', label: 'Merchandise', icon: <ShoppingBag className="h-4 w-4" /> },
];

export const ChristmasGiftGuide = () => {
  const [gifts, setGifts] = useState<GiftItem[]>(DEFAULT_GIFTS);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchGiftGuide();
  }, []);

  const fetchGiftGuide = async () => {
    try {
      const { data, error } = await supabase
        .from('christmas_gift_guide')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (data && data.length > 0) {
        setGifts(data.map(item => ({
          ...item,
          external_links: item.external_links as { name: string; url: string }[] | null
        })));
      }
    } catch (error) {
      console.error('Failed to fetch gift guide:', error);
    }
  };

  const filteredGifts = activeCategory === 'all' 
    ? gifts 
    : gifts.filter(gift => gift.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'vinyl': return <Disc className="h-4 w-4" />;
      case 'merch': return <ShoppingBag className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          🎁 Kerst Cadeau Gids
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          De beste cadeaus voor muziekliefhebbers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4 w-full">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1 text-xs sm:text-sm">
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Gift Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredGifts.map((gift) => (
            <div 
              key={gift.id}
              className="bg-muted/20 rounded-xl p-4 space-y-3 hover:bg-muted/30 transition-all"
            >
              {/* Gift Image Placeholder */}
              <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center">
                {gift.image_url ? (
                  <img src={gift.image_url} alt={gift.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-4xl">
                    {gift.category === 'audio' ? '🎧' : gift.category === 'vinyl' ? '💿' : '👕'}
                  </div>
                )}
              </div>

              {/* Gift Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{gift.title}</h4>
                  <Badge variant="secondary" className="shrink-0">
                    {gift.price_range}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {gift.description}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryIcon(gift.category)}
                    <span className="ml-1 capitalize">{gift.category}</span>
                  </Badge>
                  
                  {gift.external_links && gift.external_links.length > 0 && (
                    <a 
                      href={gift.external_links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                    >
                      <Button size="sm" variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {gift.external_links[0].name}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shop Link */}
        <div className="text-center pt-4">
          <Link to="/shop">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Bekijk onze MusicScan Shop
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
