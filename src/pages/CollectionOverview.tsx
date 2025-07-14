import { useCollectionStats } from "@/hooks/useCollectionStats";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Music,
  Disc,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Package,
  ArrowLeft,
  Download,
  Disc3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function CollectionOverview() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useCollectionStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading collection data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Collectie Overzicht</h1>
            <p className="text-muted-foreground">Diepgaande analyse van je muziekcollectie</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Collection Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totaal Items"
          value={stats.totalItems}
          subtitle={`${stats.totalCDs} CD's • ${stats.totalVinyls} LP's`}
          icon={Package}
        />
        <StatCard
          title="Totale Waarde"
          value={formatCurrency(stats.totalValue)}
          subtitle={`${stats.itemsWithPricing} items met prijzen`}
          icon={DollarSign}
        />
        <StatCard
          title="Gemiddelde Waarde"
          value={formatCurrency(stats.averageValue)}
          subtitle="Per item met prijsinformatie"
          icon={TrendingUp}
        />
        <StatCard
          title="Waardevolste Item"
          value={formatCurrency(
            stats.mostValuableItem?.median_price || 
            stats.mostValuableItem?.calculated_advice_price || 
            stats.mostValuableItem?.marketplace_price || 0
          )}
          subtitle={stats.mostValuableItem ? `${stats.mostValuableItem.artist || 'Onbekend'} - ${stats.mostValuableItem.title || 'Onbekend'}`.substring(0, 40) + "..." : 'Geen data'}
          icon={Star}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Genre Verdeling
            </CardTitle>
            <CardDescription>Verdeling van genres in je collectie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.genres.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.genres.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Range Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Prijs Verdeling
            </CardTitle>
            <CardDescription>Verdeling van prijsklassen</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.priceRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Year Timeline */}
      {stats.years.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tijdlijn Collectie
            </CardTitle>
            <CardDescription>Verdeling van release jaren</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.years}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Artists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Artiesten
            </CardTitle>
            <CardDescription>Artiesten met de meeste albums</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.artists.slice(0, 10).map((artist, index) => (
                <div key={artist.artist} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{artist.artist}</p>
                      <p className="text-sm text-muted-foreground">
                        {artist.count} album{artist.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {artist.value > 0 && (
                    <Badge variant="secondary">
                      {formatCurrency(artist.value)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Format & Condition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Disc className="h-5 w-5" />
              Format & Conditie
            </CardTitle>
            <CardDescription>Overzicht van formats en condities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Format Verdeling</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4" />
                  <span className="text-sm">CD's: {stats.totalCDs}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4" />
                  <span className="text-sm">LP's: {stats.totalVinyls}</span>
                </div>
              </div>
            </div>
            
            {stats.conditions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Conditie Verdeling</h4>
                <div className="space-y-2">
                  {stats.conditions.map((condition) => (
                    <div key={condition.condition} className="flex justify-between">
                      <span className="text-sm">{condition.condition}</span>
                      <Badge variant="outline">{condition.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fun Facts */}
      <Card>
        <CardHeader>
          <CardTitle>🎵 Fun Facts over je Collectie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Meest Populaire Genre</h4>
              <p className="text-2xl font-bold text-primary">{stats.genres[0]?.genre || 'Onbekend'}</p>
              <p className="text-sm text-muted-foreground">{stats.genres[0]?.count || 0} albums</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Oudste Release</h4>
              <p className="text-2xl font-bold text-primary">{stats.years[0]?.year || 'Onbekend'}</p>
              <p className="text-sm text-muted-foreground">Eerste album in collectie</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Nieuwste Release</h4>
              <p className="text-2xl font-bold text-primary">{stats.years[stats.years.length - 1]?.year || 'Onbekend'}</p>
              <p className="text-sm text-muted-foreground">Laatste album in collectie</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}