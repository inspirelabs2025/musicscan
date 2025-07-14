import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Search, Filter, Edit, Upload, Disc3, Music, Euro, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  type: 'CD' | 'Vinyl';
  artist: string;
  title: string;
  year: number | null;
  condition_grade: string | null;
  discogs_id: number | null;
  discogs_url: string | null;
  calculated_advice_price: number | null;
  marketplace_price: number | null;
  marketplace_status: string;
  marketplace_comments: string | null;
  marketplace_allow_offers: boolean;
  marketplace_location: string;
  marketplace_sleeve_condition: string | null;
  marketplace_weight: number;
  created_at: string;
}

export default function MarketplaceOverview() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    fetchMarketplaceItems();
  }, []);

  const fetchMarketplaceItems = async () => {
    try {
      setLoading(true);
      
      // Fetch CD scans - show ALL scanned items
      const { data: cdData, error: cdError } = await supabase
        .from('cd_scan')
        .select('*')
        .order('created_at', { ascending: false });

      if (cdError) throw cdError;

      // Fetch Vinyl scans - show ALL scanned items
      const { data: vinylData, error: vinylError } = await supabase
        .from('vinyl2_scan')
        .select('*')
        .order('created_at', { ascending: false });

      if (vinylError) throw vinylError;

      // Combine and format data
      const combinedItems: MarketplaceItem[] = [
        ...(cdData || []).map(item => ({
          ...item,
          type: 'CD' as const,
          marketplace_price: item.marketplace_price || item.calculated_advice_price,
          marketplace_status: item.marketplace_status || 'For Sale',
          marketplace_allow_offers: item.marketplace_allow_offers ?? true,
          marketplace_location: item.marketplace_location || 'Netherlands',
          marketplace_weight: item.marketplace_weight || 100,
        })),
        ...(vinylData || []).map(item => ({
          ...item,
          type: 'Vinyl' as const,
          marketplace_price: item.marketplace_price || item.calculated_advice_price,
          marketplace_status: item.marketplace_status || 'For Sale',
          marketplace_allow_offers: item.marketplace_allow_offers ?? true,
          marketplace_location: item.marketplace_location || 'Netherlands',
          marketplace_weight: item.marketplace_weight || 230,
        }))
      ];

      setItems(combinedItems);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      toast({
        title: "Fout",
        description: "Kon marketplace items niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemStatus = (item: MarketplaceItem) => {
    if (item.discogs_id) {
      return 'ready';
    }
    return 'needs_discogs_id';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = filterFormat === 'all' || item.type === filterFormat;
    
    const status = getItemStatus(item);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'ready' && status === 'ready') ||
      (filterStatus === 'needs_discogs_id' && status === 'needs_discogs_id');
    
    return matchesSearch && matchesFormat && matchesStatus;
  });

  const updateMarketplaceItem = async (itemId: string, type: string, updates: Partial<MarketplaceItem>) => {
    try {
      const table = type === 'CD' ? 'cd_scan' : 'vinyl2_scan';
      
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Opgeslagen",
        description: "Marketplace gegevens zijn bijgewerkt",
        variant: "default"
      });

      fetchMarketplaceItems();
    } catch (error) {
      console.error('Error updating marketplace item:', error);
      toast({
        title: "Fout",
        description: "Kon marketplace gegevens niet opslaan",
        variant: "destructive"
      });
    }
  };

  const generateDiscogsJSON = (item: MarketplaceItem) => {
    return {
      release_id: item.discogs_id,
      condition: item.condition_grade || "Very Good (VG)",
      price: item.marketplace_price || 0,
      comments: item.marketplace_comments || `Scanned with VinylScanner - ${item.type} in excellent condition`,
      allow_offers: item.marketplace_allow_offers,
      status: item.marketplace_status,
      external_id: `${item.type.toUpperCase()}-${item.id.slice(0, 8)}`,
      location: item.marketplace_location,
      ...(item.type === 'Vinyl' && { sleeve_condition: item.marketplace_sleeve_condition || item.condition_grade }),
      weight: item.marketplace_weight,
      format_quantity: 1
    };
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllItems = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden van marketplace items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discogs Marketplace</h1>
        <p className="text-muted-foreground">
          Beheer en upload je gescande albums naar Discogs Marketplace
        </p>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op artiest of titel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle formaten</SelectItem>
                <SelectItem value="CD">CD</SelectItem>
                <SelectItem value="Vinyl">Vinyl</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Eye className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="ready">Discogs klaar</SelectItem>
                <SelectItem value="needs_discogs_id">Heeft Discogs ID nodig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
              onCheckedChange={selectAllItems}
            />
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} van {filteredItems.length} geselecteerd
            </span>
            {selectedItems.size > 0 && (
              <Button size="sm" className="ml-auto">
                <Upload className="h-4 w-4 mr-2" />
                Upload naar Discogs ({selectedItems.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />
                  {item.type === 'CD' ? (
                    <Disc3 className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Music className="h-5 w-5 text-purple-600" />
                  )}
                  <Badge variant={item.type === 'CD' ? 'default' : 'secondary'}>
                    {item.type}
                  </Badge>
                  {getItemStatus(item) === 'ready' ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Discogs klaar
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Discogs ID nodig
                    </Badge>
                  )}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Marketplace Details bewerken</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                      <EditMarketplaceForm
                        item={editingItem}
                        onSave={(updates) => {
                          updateMarketplaceItem(editingItem.id, editingItem.type, updates);
                          setEditingItem(null);
                        }}
                        onCancel={() => setEditingItem(null)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <CardTitle className="text-lg">
                {item.artist} - {item.title}
              </CardTitle>
              {item.year && (
                <p className="text-sm text-muted-foreground">{item.year}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Conditie:</span>
                  <Badge variant="outline">{item.condition_grade || 'Onbekend'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prijs:</span>
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    <span className="font-medium">
                      {item.marketplace_price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {item.marketplace_status}
                  </Badge>
                </div>
                {item.discogs_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => window.open(item.discogs_url!, '_blank')}
                  >
                    Bekijk op Discogs
                  </Button>
                )}
                {!item.discogs_id && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-xs text-orange-700">
                      Geen Discogs ID gevonden. Dit item moet handmatig gekoppeld worden.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Geen items gevonden</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterFormat !== 'all' 
                ? 'Probeer je zoekcriteria aan te passen'
                : 'Scan eerst enkele albums om ze hier te zien verschijnen'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface EditMarketplaceFormProps {
  item: MarketplaceItem;
  onSave: (updates: Partial<MarketplaceItem>) => void;
  onCancel: () => void;
}

function EditMarketplaceForm({ item, onSave, onCancel }: EditMarketplaceFormProps) {
  const [formData, setFormData] = useState({
    marketplace_price: item.marketplace_price || 0,
    marketplace_comments: item.marketplace_comments || '',
    marketplace_allow_offers: item.marketplace_allow_offers,
    marketplace_location: item.marketplace_location,
    marketplace_sleeve_condition: item.marketplace_sleeve_condition || '',
    marketplace_weight: item.marketplace_weight
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const discogsJSON = {
    release_id: item.discogs_id,
    condition: item.condition_grade || "Very Good (VG)",
    price: formData.marketplace_price,
    comments: formData.marketplace_comments || `Scanned with VinylScanner - ${item.type} in excellent condition`,
    allow_offers: formData.marketplace_allow_offers,
    status: item.marketplace_status,
    external_id: `${item.type.toUpperCase()}-${item.id.slice(0, 8)}`,
    location: formData.marketplace_location,
    ...(item.type === 'Vinyl' && { sleeve_condition: formData.marketplace_sleeve_condition || item.condition_grade }),
    weight: formData.marketplace_weight,
    format_quantity: 1
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Prijs (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.marketplace_price}
            onChange={(e) => setFormData({
              ...formData,
              marketplace_price: parseFloat(e.target.value) || 0
            })}
          />
        </div>
        <div>
          <Label htmlFor="weight">Gewicht (gram)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.marketplace_weight}
            onChange={(e) => setFormData({
              ...formData,
              marketplace_weight: parseInt(e.target.value) || 0
            })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Locatie</Label>
        <Input
          id="location"
          value={formData.marketplace_location}
          onChange={(e) => setFormData({
            ...formData,
            marketplace_location: e.target.value
          })}
        />
      </div>

      {item.type === 'Vinyl' && (
        <div>
          <Label htmlFor="sleeve_condition">Hoes Conditie</Label>
          <Select 
            value={formData.marketplace_sleeve_condition}
            onValueChange={(value) => setFormData({
              ...formData,
              marketplace_sleeve_condition: value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer conditie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mint (M)">Mint (M)</SelectItem>
              <SelectItem value="Near Mint (NM or M-)">Near Mint (NM or M-)</SelectItem>
              <SelectItem value="Very Good Plus (VG+)">Very Good Plus (VG+)</SelectItem>
              <SelectItem value="Very Good (VG)">Very Good (VG)</SelectItem>
              <SelectItem value="Good Plus (G+)">Good Plus (G+)</SelectItem>
              <SelectItem value="Good (G)">Good (G)</SelectItem>
              <SelectItem value="Fair (F)">Fair (F)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="comments">Opmerkingen</Label>
        <Textarea
          id="comments"
          value={formData.marketplace_comments}
          onChange={(e) => setFormData({
            ...formData,
            marketplace_comments: e.target.value
          })}
          placeholder="Aanvullende informatie over het item..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={formData.marketplace_allow_offers}
          onCheckedChange={(checked) => setFormData({
            ...formData,
            marketplace_allow_offers: !!checked
          })}
        />
        <Label>Biedingen accepteren</Label>
      </div>

      {/* Discogs JSON Preview */}
      <div className="mt-6">
        <Label>Discogs API Preview:</Label>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto mt-2">
          {JSON.stringify(discogsJSON, null, 2)}
        </pre>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Opslaan
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}