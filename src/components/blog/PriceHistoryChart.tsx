import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Euro, Calendar, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PriceData {
  date: string;
  lowest_price: number;
  median_price: number;
  highest_price: number;
  num_for_sale: number;
}

interface PriceHistoryChartProps {
  discogsId?: number;
  albumTitle: string;
  albumArtist: string;
}

export function PriceHistoryChart({ discogsId, albumTitle, albumArtist }: PriceHistoryChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPriceType, setSelectedPriceType] = useState<'lowest' | 'median' | 'highest'>('median');
  
  useEffect(() => {
    const loadPriceHistory = async () => {
      if (!discogsId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('discogs_pricing_sessions')
          .select('created_at, lowest_price, median_price, highest_price, num_for_sale')
          .eq('discogs_id', discogsId)
          .not('median_price', 'is', null)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedData = (data || []).map(item => ({
          date: new Date(item.created_at).toLocaleDateString('nl-NL', { 
            month: 'short', 
            year: 'numeric' 
          }),
          lowest_price: item.lowest_price || 0,
          median_price: item.median_price || 0,
          highest_price: item.highest_price || 0,
          num_for_sale: item.num_for_sale || 0,
        }));

        setPriceData(formattedData);
      } catch (error) {
        console.error('Error loading price history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPriceHistory();
  }, [discogsId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Prijshistorie laden...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!discogsId || priceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Prijshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>Geen prijshistorie beschikbaar voor dit album.</p>
            {!discogsId && (
              <p className="text-sm mt-1">Dit album is nog niet gekoppeld aan Discogs.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate price trend
  const firstPrice = priceData[0]?.[`${selectedPriceType}_price`] || 0;
  const lastPrice = priceData[priceData.length - 1]?.[`${selectedPriceType}_price`] || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100) : 0;

  const getTrendIcon = () => {
    if (priceChangePercent > 5) return <TrendingUp className="text-green-600" size={16} />;
    if (priceChangePercent < -5) return <TrendingDown className="text-red-600" size={16} />;
    return <Minus className="text-gray-600" size={16} />;
  };

  const getTrendColor = () => {
    if (priceChangePercent > 5) return 'text-green-600';
    if (priceChangePercent < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: €{entry.value?.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getLineColor = () => {
    switch (selectedPriceType) {
      case 'lowest': return '#10b981'; // green
      case 'highest': return '#ef4444'; // red
      default: return '#3b82f6'; // blue
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} />
            Prijshistorie
          </div>
          <Select value={selectedPriceType} onValueChange={(value: any) => setSelectedPriceType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowest">Laagste</SelectItem>
              <SelectItem value="median">Mediaan</SelectItem>
              <SelectItem value="highest">Hoogste</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Euro size={16} />
              <span className="text-sm font-medium">Huidige Prijs</span>
            </div>
            <p className="text-lg font-bold">
              €{lastPrice.toFixed(2)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              {getTrendIcon()}
              <span className="text-sm font-medium">Trend</span>
            </div>
            <p className={`text-lg font-bold ${getTrendColor()}`}>
              {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar size={16} />
              <span className="text-sm font-medium">Metingen</span>
            </div>
            <p className="text-lg font-bold">
              {priceData.length}
            </p>
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={`${selectedPriceType}_price`}
                stroke={getLineColor()}
                strokeWidth={2}
                dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getLineColor(), strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Market Insights */}
        <div className="space-y-3">
          <h4 className="font-medium">Marktinzichten</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm">Prijsrange:</span>
              <span className="font-medium">
                €{Math.min(...priceData.map(d => d.lowest_price)).toFixed(2)} - 
                €{Math.max(...priceData.map(d => d.highest_price)).toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <span className="text-sm">Gem. te koop:</span>
              <span className="font-medium">
                {Math.round(priceData.reduce((sum, d) => sum + d.num_for_sale, 0) / priceData.length)} exemplaren
              </span>
            </div>
          </div>

          {/* Price Trend Analysis */}
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-start gap-2">
              {getTrendIcon()}
              <div>
                <p className="text-sm font-medium mb-1">Prijstrend Analyse</p>
                <p className="text-xs text-muted-foreground">
                  {priceChangePercent > 10 && "Sterke waardestijging - dit album wordt steeds zeldzamer."}
                  {priceChangePercent > 5 && priceChangePercent <= 10 && "Lichte waardestijging - goede investering."}
                  {priceChangePercent >= -5 && priceChangePercent <= 5 && "Stabiele prijsontwikkeling - consistent in waarde."}
                  {priceChangePercent < -5 && "Prijsdaling - mogelijk meer aanbod gekomen."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Source */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Prijsdata afkomstig van Discogs Marketplace • Laatste update: {priceData[priceData.length - 1]?.date}
        </div>
      </CardContent>
    </Card>
  );
}