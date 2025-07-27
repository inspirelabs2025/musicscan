import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Search, Filter, Edit, Upload, Disc3, Music, Euro, AlertTriangle, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { Navigation } from "@/components/Navigation";
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
      const {
        data: cdData,
        error: cdError
      } = await supabase.from('cd_scan').select('*').order('created_at', {
        ascending: false
      });
      if (cdError) throw cdError;

      // Fetch Vinyl scans - show ALL scanned items
      const {
        data: vinylData,
        error: vinylError
      } = await supabase.from('vinyl2_scan').select('*').order('created_at', {
        ascending: false
      });
      if (vinylError) throw vinylError;

      // Combine and format data
      const combinedItems: MarketplaceItem[] = [...(cdData || []).map(item => ({
        ...item,
        type: 'CD' as const,
        marketplace_price: item.marketplace_price || item.calculated_advice_price,
        marketplace_status: item.marketplace_status || 'For Sale',
        marketplace_allow_offers: item.marketplace_allow_offers ?? true,
        marketplace_location: item.marketplace_location || 'Netherlands',
        marketplace_weight: item.marketplace_weight || 100
      })), ...(vinylData || []).map(item => ({
        ...item,
        type: 'Vinyl' as const,
        marketplace_price: item.marketplace_price || item.calculated_advice_price,
        marketplace_status: item.marketplace_status || 'For Sale',
        marketplace_allow_offers: item.marketplace_allow_offers ?? true,
        marketplace_location: item.marketplace_location || 'Netherlands',
        marketplace_weight: item.marketplace_weight || 230
      }))];
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
    const matchesSearch = searchTerm === '' || item.artist?.toLowerCase().includes(searchTerm.toLowerCase()) || item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = filterFormat === 'all' || item.type === filterFormat;
    const status = getItemStatus(item);
    const matchesStatus = filterStatus === 'all' || filterStatus === 'ready' && status === 'ready' || filterStatus === 'needs_discogs_id' && status === 'needs_discogs_id';
    return matchesSearch && matchesFormat && matchesStatus;
  });
  const updateMarketplaceItem = async (itemId: string, type: string, updates: Partial<MarketplaceItem>) => {
    try {
      const table = type === 'CD' ? 'cd_scan' : 'vinyl2_scan';
      const {
        error
      } = await supabase.from(table).update(updates).eq('id', itemId);
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
  const deleteMarketplaceItem = async (itemId: string, type: string) => {
    try {
      const table = type === 'CD' ? 'cd_scan' : 'vinyl2_scan';
      const {
        error
      } = await supabase.from(table).delete().eq('id', itemId);
      if (error) throw error;
      toast({
        title: "Verwijderd",
        description: "Item is succesvol verwijderd",
        variant: "default"
      });
      fetchMarketplaceItems();
    } catch (error) {
      console.error('Error deleting marketplace item:', error);
      toast({
        title: "Fout",
        description: "Kon item niet verwijderen",
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
      ...(item.type === 'Vinyl' && {
        sleeve_condition: item.marketplace_sleeve_condition || item.condition_grade
      }),
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
    return <>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-vinyl-purple/5 relative">
          {/* Musical Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 text-6xl animate-bounce opacity-10">🎵</div>
            <div className="absolute top-40 right-20 text-4xl animate-pulse opacity-10">🎶</div>
            <div className="absolute bottom-40 left-1/4 text-5xl animate-bounce opacity-10" style={{
            animationDelay: '1s'
          }}>♪</div>
            <div className="absolute bottom-20 right-1/3 text-3xl animate-pulse opacity-10" style={{
            animationDelay: '2s'
          }}>♫</div>
            <div className="absolute top-1/3 left-1/2 text-4xl animate-bounce opacity-10" style={{
            animationDelay: '0.5s'
          }}>🎼</div>
          </div>
          <div className="container mx-auto px-4 py-8 relative">
            <div className="text-center">
              <div className="bg-gradient-to-br from-vinyl-purple/10 to-vinyl-gold/10 backdrop-blur-sm border border-vinyl-purple/20 rounded-3xl p-12 mx-auto max-w-md">
                <div className="text-6xl mb-4 animate-bounce">🎵</div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-vinyl-purple mx-auto mb-4"></div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent mb-2">
                  Laden van marketplace items...
                </h2>
                <p className="text-muted-foreground">✨ Bereid je collectie voor</p>
              </div>
            </div>
          </div>
        </div>
      </>;
  }
  return <>
      <Navigation />
      {/* Musical Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl animate-bounce opacity-10">🎵</div>
        <div className="absolute top-40 right-20 text-4xl animate-pulse opacity-10">🎶</div>
        <div className="absolute bottom-40 left-1/4 text-5xl animate-bounce opacity-10" style={{
        animationDelay: '1s'
      }}>♪</div>
        <div className="absolute bottom-20 right-1/3 text-3xl animate-pulse opacity-10" style={{
        animationDelay: '2s'
      }}>♫</div>
        <div className="absolute top-1/3 left-1/2 text-4xl animate-bounce opacity-10" style={{
        animationDelay: '0.5s'
      }}>🎼</div>
      </div>
      
      {/* Main Container with Gradient Background */}
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-vinyl-purple/5 relative">
        <div className="container mx-auto px-4 py-8 relative">
          {/* Enhanced Header with Gradients */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-vinyl-purple/20 via-transparent to-vinyl-gold/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-vinyl-purple/10 to-vinyl-gold/10 backdrop-blur-sm border border-vinyl-purple/20 rounded-3xl p-8 mx-auto max-w-4xl">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent animate-fade-in">🛒 Marketplace</h1>
              <p className="text-xl text-muted-foreground/80 animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>Beheer en upload je gescande albums naar Marketplace✨
Discogs export mogelijk</p>
              <div className="flex justify-center gap-8 mt-6 animate-fade-in" style={{
              animationDelay: '0.4s'
            }}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-vinyl-purple">📦</div>
                  <div className="text-sm text-muted-foreground">Inventory</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-vinyl-gold">💰</div>
                  <div className="text-sm text-muted-foreground">Pricing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-vinyl-purple">🚀</div>
                  <div className="text-sm text-muted-foreground">Upload</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters & Search with Gradient */}
          <Card className="mb-8 bg-gradient-to-br from-vinyl-purple/5 to-vinyl-gold/5 border-vinyl-purple/20 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="pt-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-vinyl-purple/10 via-transparent to-vinyl-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vinyl-purple animate-pulse" />
                    <Input placeholder="🔍 Zoek op artiest of titel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-background/80 backdrop-blur-sm border-vinyl-purple/30 focus:border-vinyl-gold/50 hover:border-vinyl-purple/50 transition-all duration-300" />
                  </div>
                  <Select value={filterFormat} onValueChange={setFilterFormat}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/80 border-vinyl-purple/30 hover:border-vinyl-gold/50 transition-all duration-300">
                      <Filter className="h-4 w-4 mr-2 text-vinyl-purple" />
                      <SelectValue placeholder="Filter format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎵 Alle formaten</SelectItem>
                      <SelectItem value="CD">💿 CD</SelectItem>
                      <SelectItem value="Vinyl">🎶 Vinyl</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/80 border-vinyl-purple/30 hover:border-vinyl-gold/50 transition-all duration-300">
                      <Eye className="h-4 w-4 mr-2 text-vinyl-purple" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">📊 Alle statussen</SelectItem>
                      <SelectItem value="ready">✅ Discogs klaar</SelectItem>
                      <SelectItem value="needs_discogs_id">🔗 Heeft Discogs ID nodig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced Bulk Actions */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 rounded-xl border border-vinyl-purple/20">
                  <Checkbox checked={selectedItems.size === filteredItems.length && filteredItems.length > 0} onCheckedChange={selectAllItems} className="data-[state=checked]:bg-vinyl-purple data-[state=checked]:border-vinyl-purple" />
                  <span className="text-sm text-muted-foreground">
                    📦 {selectedItems.size} van {filteredItems.length} geselecteerd
                  </span>
                  {selectedItems.size > 0 && <Button size="sm" className="ml-auto bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:scale-105 transition-transform duration-200 shadow-lg">
                      <Upload className="h-4 w-4 mr-2" />
                      🚀 Upload naar Discogs ({selectedItems.size})
                    </Button>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Items Grid with Animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredItems.map((item, index) => <Card key={item.id} className="group relative bg-gradient-to-br from-vinyl-purple/5 to-vinyl-gold/5 border-vinyl-purple/20 hover:shadow-2xl hover:shadow-vinyl-purple/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-sm" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/10 via-transparent to-vinyl-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="pb-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => toggleItemSelection(item.id)} className="data-[state=checked]:bg-vinyl-purple data-[state=checked]:border-vinyl-purple" />
                      {item.type === 'CD' ? <div className="flex items-center gap-1">
                          <Disc3 className="h-5 w-5 text-vinyl-purple group-hover:animate-pulse" />
                          <span className="text-sm">💿</span>
                        </div> : <div className="flex items-center gap-1">
                          <Music className="h-5 w-5 text-vinyl-gold group-hover:animate-pulse" />
                          <span className="text-sm">🎶</span>
                        </div>}
                      <Badge variant={item.type === 'CD' ? 'default' : 'secondary'} className={item.type === 'CD' ? 'bg-vinyl-purple text-white' : 'bg-vinyl-gold text-white'}>
                        {item.type}
                      </Badge>
                      {getItemStatus(item) === 'ready' ? <Badge variant="outline" className="text-vinyl-gold border-vinyl-gold bg-zinc-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ✅ Discogs klaar
                        </Badge> : <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          🔗 Discogs ID nodig
                        </Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(item)} className="border-vinyl-purple/30 hover:border-vinyl-gold/50 hover:bg-vinyl-purple/10 transition-all duration-200">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-vinyl-purple/5 to-vinyl-gold/5 border-vinyl-purple/20">
                          <DialogHeader>
                            <DialogTitle className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
                              ✏️ Marketplace Details bewerken
                            </DialogTitle>
                          </DialogHeader>
                          {editingItem && <EditMarketplaceForm item={editingItem} onSave={updates => {
                        updateMarketplaceItem(editingItem.id, editingItem.type, updates);
                        setEditingItem(null);
                      }} onCancel={() => setEditingItem(null)} />}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-800">🗑️ Item verwijderen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je "{item.artist} - {item.title}" wilt verwijderen? 
                              Deze actie kan niet ongedaan gemaakt worden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMarketplaceItem(item.id, item.type)} className="bg-red-600 hover:bg-red-700">
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="text-lg bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                    🎵 {item.artist} - {item.title}
                  </CardTitle>
                  {item.year && <p className="text-sm text-muted-foreground">📅 {item.year}</p>}
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="space-y-3 bg-zinc-200">
                    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 rounded-lg bg-gray-200">
                      <span className="text-sm font-medium text-vinyl-purple">📋 Conditie:</span>
                      <Badge variant="outline" className="border-vinyl-purple/30 bg-vinyl-purple/5">
                        {item.condition_grade || 'Onbekend'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-vinyl-gold/10 to-vinyl-purple/10 rounded-lg bg-slate-400">
                      <span className="text-sm font-medium text-vinyl-gold">💰 Prijs:</span>
                      <div className="flex items-center gap-1 text-vinyl-gold font-bold">
                        <Euro className="h-4 w-4 bg-transparent" />
                        <span className="text-gray-900">
                          {item.marketplace_price?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 rounded-lg">
                      <span className="text-sm font-medium text-vinyl-purple">📊 Status:</span>
                      <Badge className="bg-gradient-to-r from-vinyl-gold to-vinyl-purple text-white">
                        {item.marketplace_status}
                      </Badge>
                    </div>
                    {item.discogs_url && <Button variant="outline" size="sm" className="w-full mt-3 bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 border-vinyl-purple/30 hover:border-vinyl-gold/50 hover:scale-105 transition-all duration-200" onClick={() => window.open(item.discogs_url!, '_blank')}>
                        🔗 Bekijk op Discogs
                      </Button>}
                    {!item.discogs_id && <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-700">
                          🔗 Geen Discogs ID gevonden. Dit item moet handmatig gekoppeld worden.
                        </p>
                      </div>}
                  </div>
                </CardContent>
              </Card>)}
          </div>

          {filteredItems.length === 0 && <Card className="bg-gradient-to-br from-vinyl-purple/5 to-vinyl-gold/5 border-vinyl-purple/20 hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 text-center py-12">
                <div className="text-6xl mb-4 animate-bounce">🎵</div>
                <h3 className="text-lg font-medium mb-2 bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
                  Geen items gevonden
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterFormat !== 'all' ? '🔍 Probeer je zoekcriteria aan te passen' : '📸 Scan eerst enkele albums om ze hier te zien verschijnen'}
                </p>
              </CardContent>
            </Card>}
        </div>
      </div>
    </>;
}
interface EditMarketplaceFormProps {
  item: MarketplaceItem;
  onSave: (updates: Partial<MarketplaceItem>) => void;
  onCancel: () => void;
}
function EditMarketplaceForm({
  item,
  onSave,
  onCancel
}: EditMarketplaceFormProps) {
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
    ...(item.type === 'Vinyl' && {
      sleeve_condition: formData.marketplace_sleeve_condition || item.condition_grade
    }),
    weight: formData.marketplace_weight,
    format_quantity: 1
  };
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Prijs (€)</Label>
          <Input id="price" type="number" step="0.01" value={formData.marketplace_price} onChange={e => setFormData({
          ...formData,
          marketplace_price: parseFloat(e.target.value) || 0
        })} />
        </div>
        <div>
          <Label htmlFor="weight">Gewicht (gram)</Label>
          <Input id="weight" type="number" value={formData.marketplace_weight} onChange={e => setFormData({
          ...formData,
          marketplace_weight: parseInt(e.target.value) || 0
        })} />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Locatie</Label>
        <Input id="location" value={formData.marketplace_location} onChange={e => setFormData({
        ...formData,
        marketplace_location: e.target.value
      })} />
      </div>

      {item.type === 'Vinyl' && <div>
          <Label htmlFor="sleeve_condition">Hoes Conditie</Label>
          <Select value={formData.marketplace_sleeve_condition} onValueChange={value => setFormData({
        ...formData,
        marketplace_sleeve_condition: value
      })}>
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
        </div>}

      <div>
        <Label htmlFor="comments">Opmerkingen</Label>
        <Textarea id="comments" value={formData.marketplace_comments} onChange={e => setFormData({
        ...formData,
        marketplace_comments: e.target.value
      })} placeholder="Aanvullende informatie over het item..." />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked={formData.marketplace_allow_offers} onCheckedChange={checked => setFormData({
        ...formData,
        marketplace_allow_offers: !!checked
      })} />
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
    </form>;
}