import { useCollectionStats } from "@/hooks/useCollectionStats";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Disc3,
  Music2,
  Clock,
  Euro,
  Brain
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AIAnalysisTab } from "@/components/AIAnalysisTab";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function CollectionOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: stats, isLoading, error } = useCollectionStats();
  
  const activeTab = searchParams.get('tab') || 'overview';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        {/* Loading Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 text-6xl opacity-10 animate-pulse">🎵</div>
          <div className="absolute top-20 right-10 text-4xl opacity-10 animate-bounce delay-300">🎶</div>
          <div className="absolute bottom-10 left-10 text-4xl opacity-10 animate-pulse delay-500">🎧</div>
        </div>
        
        <div className="container mx-auto p-6 space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 animate-pulse" />
            <Skeleton className="h-96 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        <div className="container mx-auto p-6 relative z-10">
          <Card className="border-destructive/50 bg-destructive/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-destructive">❌ Error loading collection data: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/5 relative overflow-hidden">
        {/* Animated Musical Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 text-6xl opacity-10 animate-pulse">🎵</div>
          <div className="absolute top-20 right-10 text-4xl opacity-10 animate-bounce delay-300">🎶</div>
          <div className="absolute top-1/3 left-1/4 text-5xl opacity-10 animate-pulse delay-700">🎼</div>
          <div className="absolute bottom-1/4 right-1/3 text-3xl opacity-10 animate-bounce delay-1000">🎤</div>
          <div className="absolute bottom-10 left-10 text-4xl opacity-10 animate-pulse delay-500">🎧</div>
          <div className="absolute top-1/2 right-1/4 text-2xl opacity-10 animate-bounce delay-1200">🎹</div>
        </div>

        <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
          {/* Enhanced Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(-1)} 
                  className="w-fit bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug
                </Button>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-vinyl-purple to-vinyl-gold bg-clip-text text-transparent animate-fade-in">
                    🎵 Collectie Overzicht 📊
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground animate-fade-in animation-delay-200">
                    ✨ Diepgaande analyse van je muziekcollectie
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => navigate('/ai-analysis')}
                  className="group relative bg-gradient-to-r from-vinyl-purple to-primary hover:from-vinyl-purple/90 hover:to-primary/90 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover-scale border border-white/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Brain className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">🧠 Start je muziek analyse</span>
                </Button>
                <Button 
                  onClick={() => navigate('/collection-chat')}
                  className="group relative bg-gradient-to-r from-vinyl-gold to-yellow-500 hover:from-vinyl-gold/90 hover:to-yellow-500/90 text-black font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover-scale border border-yellow-300/30 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Music2 className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">💬 Chat met je muziek</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="group w-fit sm:w-auto bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 hover-scale"
                >
                  <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  <span className="hidden sm:inline">📊 Export Data</span>
                  <span className="sm:hidden">📊 Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="grid w-full grid-cols-6 min-w-max sm:min-w-0 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">📦 Overzicht</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-analysis" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">🤖 AI</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="type" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Disc className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">💿 Type</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="genre" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">🎵 Genre</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">📅 Jaar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="price" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 hover-scale rounded-lg"
                >
                  <Euro className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm hidden sm:inline">💰 Prijs</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents with Enhanced Styling */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              <OverviewTab stats={stats} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-6 animate-fade-in">
              <AIAnalysisTab />
            </TabsContent>

            <TabsContent value="type" className="space-y-6 animate-fade-in">
              <TypeTab stats={stats} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="genre" className="space-y-6 animate-fade-in">
              <GenreTab stats={stats} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="year" className="space-y-6 animate-fade-in">
              <YearTab stats={stats} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="price" className="space-y-6 animate-fade-in">
              <PriceTab stats={stats} formatCurrency={formatCurrency} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

// Overview Tab Component
function OverviewTab({ stats, formatCurrency }: { stats: any; formatCurrency: (value: number) => string }) {
  return (
    <>
      {/* Enhanced Collection Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="group hover-scale">
          <StatCard
            title="📦 Totaal Items"
            value={stats.totalItems}
            subtitle={`${stats.totalCDs} CD's • ${stats.totalVinyls} LP's`}
            icon={Package}
          />
        </div>
        <div className="group hover-scale">
          <StatCard
            title="💰 Totale Waarde"
            value={formatCurrency(stats.totalValue)}
            subtitle={`${stats.itemsWithPricing} items met prijzen`}
            icon={DollarSign}
          />
        </div>
        <div className="group hover-scale">
          <StatCard
            title="📈 Gemiddelde Waarde"
            value={formatCurrency(stats.averageValue)}
            subtitle="Per item met prijsinformatie"
            icon={TrendingUp}
          />
        </div>
        <div className="group hover-scale">
          <StatCard
            title="⭐ Waardevolste Item"
            value={formatCurrency(
              stats.mostValuableItem?.calculated_advice_price || 
              stats.mostValuableItem?.median_price || 
              stats.mostValuableItem?.marketplace_price || 0
            )}
            subtitle={stats.mostValuableItem ? `${stats.mostValuableItem.artist || 'Onbekend'} - ${stats.mostValuableItem.title || 'Onbekend'}`.substring(0, 40) + "..." : 'Geen data'}
            icon={Star}
          />
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Genre Distribution */}
        <Card className="group bg-gradient-to-br from-vinyl-purple/20 to-card/80 backdrop-blur-sm border border-vinyl-purple/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
          <CardHeader className="relative">
            <div className="absolute top-2 right-2 text-2xl opacity-20 group-hover:animate-spin">🎵</div>
            <CardTitle className="flex items-center gap-2 text-foreground bg-gradient-to-r from-vinyl-purple to-primary bg-clip-text text-transparent">
              <Music className="h-5 w-5 text-vinyl-purple" />
              🎼 Genre Verdeling
            </CardTitle>
            <CardDescription className="text-muted-foreground">Verdeling van genres in je collectie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.genres.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ genre, percent }) => percent > 0.05 ? `${genre}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="genre"
                >
                  {stats.genres.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} items`, name]}
                  labelFormatter={(label) => `Genre: ${label}`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Range Distribution */}
        <Card className="group bg-gradient-to-br from-vinyl-gold/20 to-card/80 backdrop-blur-sm border border-vinyl-gold/30 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
          <CardHeader className="relative">
            <div className="absolute top-2 right-2 text-2xl opacity-20 group-hover:animate-bounce">💰</div>
            <CardTitle className="flex items-center gap-2 text-foreground bg-gradient-to-r from-vinyl-gold to-yellow-600 bg-clip-text text-transparent">
              <DollarSign className="h-5 w-5 text-vinyl-gold" />
              💸 Prijs Verdeling
            </CardTitle>
            <CardDescription className="text-muted-foreground">Verdeling van prijsklassen</CardDescription>
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
        <Card variant="purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
              <Calendar className="h-5 w-5" />
              Tijdlijn Collectie
            </CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Verdeling van release jaren</CardDescription>
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

      {/* Top Artists and Format & Condition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card variant="purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
              <Users className="h-5 w-5" />
              Top Artiesten
            </CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Artiesten met de meeste albums</CardDescription>
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
                      <p className="font-medium text-card-purple-foreground">{artist.artist}</p>
                      <p className="text-sm text-card-purple-foreground/70">
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

        <Card variant="purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
              <Disc className="h-5 w-5" />
              Format & Conditie
            </CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Overzicht van formats en condities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-card-purple-foreground">Format Verdeling</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4 text-card-purple-foreground" />
                  <span className="text-sm text-card-purple-foreground">CD's: {stats.totalCDs}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4 text-card-purple-foreground" />
                  <span className="text-sm text-card-purple-foreground">LP's: {stats.totalVinyls}</span>
                </div>
              </div>
            </div>
            
            {stats.conditions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-card-purple-foreground">Conditie Verdeling</h4>
                <div className="space-y-2">
                  {stats.conditions.map((condition) => (
                    <div key={condition.condition} className="flex justify-between">
                      <span className="text-sm text-card-purple-foreground">{condition.condition}</span>
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
      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-card-purple-foreground">🎵 Fun Facts over je Collectie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-card-dark rounded-lg border border-card-dark">
              <h4 className="font-medium text-card-dark-foreground">Meest Populaire Genre</h4>
              <p className="text-2xl font-bold text-primary">{stats.genres[0]?.genre || 'Onbekend'}</p>
              <p className="text-sm text-card-dark-foreground/70">{stats.genres[0]?.count || 0} albums</p>
            </div>
            
            <div className="p-4 bg-card-dark rounded-lg border border-card-dark">
              <h4 className="font-medium text-card-dark-foreground">Oudste Release</h4>
              <p className="text-2xl font-bold text-primary">{stats.years[0]?.year || 'Onbekend'}</p>
              <p className="text-sm text-card-dark-foreground/70">Eerste album in collectie</p>
            </div>
            
            <div className="p-4 bg-card-dark rounded-lg border border-card-dark">
              <h4 className="font-medium text-card-dark-foreground">Nieuwste Release</h4>
              <p className="text-2xl font-bold text-primary">{stats.years[stats.years.length - 1]?.year || 'Onbekend'}</p>
              <p className="text-sm text-card-dark-foreground/70">Laatste album in collectie</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Type Tab Component
function TypeTab({ stats, formatCurrency }: { stats: any; formatCurrency: (value: number) => string }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* CD Collection */}
        <Card variant="purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
              <Disc className="h-5 w-5" />
              CD Collectie
            </CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Analyse van je CD collectie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Totaal</p>
                <p className="text-2xl font-bold">{stats.typeBreakdown.cd.totalItems}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Waarde</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.typeBreakdown.cd.totalValue)}</p>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Gemiddelde Waarde</p>
              <p className="text-xl font-bold">{formatCurrency(stats.typeBreakdown.cd.averageValue)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Top Genres</h4>
              <div className="space-y-2">
                {stats.typeBreakdown.cd.topGenres.slice(0, 3).map((genre) => (
                  <div key={genre.genre} className="flex justify-between">
                    <span className="text-sm">{genre.genre}</span>
                    <Badge variant="outline">{genre.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vinyl Collection */}
        <Card variant="purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
              <Disc3 className="h-5 w-5" />
              Vinyl Collectie
            </CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Analyse van je LP collectie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Totaal</p>
                <p className="text-2xl font-bold">{stats.typeBreakdown.vinyl.totalItems}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Waarde</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.typeBreakdown.vinyl.totalValue)}</p>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Gemiddelde Waarde</p>
              <p className="text-xl font-bold">{formatCurrency(stats.typeBreakdown.vinyl.averageValue)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Top Genres</h4>
              <div className="space-y-2">
                {stats.typeBreakdown.vinyl.topGenres.slice(0, 3).map((genre) => (
                  <div key={genre.genre} className="flex justify-between">
                    <span className="text-sm">{genre.genre}</span>
                    <Badge variant="outline">{genre.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="purple">
          <CardHeader>
            <CardTitle className="text-card-purple-foreground">Waarde Vergelijking</CardTitle>
            <CardDescription className="text-card-purple-foreground/70">CD vs Vinyl waarde verdeling</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'CD', value: stats.typeBreakdown.cd.totalValue, count: stats.typeBreakdown.cd.totalItems },
                { name: 'Vinyl', value: stats.typeBreakdown.vinyl.totalValue, count: stats.typeBreakdown.vinyl.totalItems }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'value' ? 'Totale Waarde' : 'Aantal']} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="purple">
          <CardHeader>
            <CardTitle className="text-card-purple-foreground">Prijsklasse Vergelijking</CardTitle>
            <CardDescription className="text-card-purple-foreground/70">Prijsverdeling per format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">CD Prijsklassen</h4>
                <div className="space-y-2">
                  {stats.typeBreakdown.cd.priceRanges.map((range) => (
                    <div key={range.range} className="flex justify-between">
                      <span className="text-sm">{range.range}</span>
                      <Badge variant="outline">{range.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Vinyl Prijsklassen</h4>
                <div className="space-y-2">
                  {stats.typeBreakdown.vinyl.priceRanges.map((range) => (
                    <div key={range.range} className="flex justify-between">
                      <span className="text-sm">{range.range}</span>
                      <Badge variant="outline">{range.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Genre Tab Component  
function GenreTab({ stats, formatCurrency }: { stats: any; formatCurrency: (value: number) => string }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.genres.slice(0, 6).map((genre, index) => {
          const details = stats.genreDetails[genre.genre];
          return (
            <Card key={genre.genre} variant="purple">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
                  <Music2 className="h-5 w-5" />
                  {genre.genre}
                </CardTitle>
                <CardDescription className="text-card-purple-foreground/70">
                  {genre.count} albums • {formatCurrency(genre.value)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Disc className="h-3 w-3" />
                    <span>{details.cdCount} CD's</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Disc3 className="h-3 w-3" />
                    <span>{details.vinylCount} LP's</span>
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">Gemiddelde waarde</p>
                  <p className="font-bold">{formatCurrency(details.averageValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top Artiesten</p>
                  <div className="space-y-1">
                    {details.topArtists.slice(0, 2).map((artist) => (
                      <div key={artist.artist} className="flex justify-between text-xs">
                        <span className="truncate">{artist.artist}</span>
                        <Badge variant="secondary" className="text-xs">{artist.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                {details.yearSpread.min > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {details.yearSpread.min} - {details.yearSpread.max}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-card-purple-foreground">Genre Waarde Verdeling</CardTitle>
          <CardDescription className="text-card-purple-foreground/70">Totale waarde per genre</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.genres.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="genre" type="category" width={100} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Waarde']} />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

// Year Tab Component
function YearTab({ stats, formatCurrency }: { stats: any; formatCurrency: (value: number) => string }) {
  const decades = Object.entries(stats.decadeBreakdown).sort(([a], [b]) => a.localeCompare(b));
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decades.map(([decade, data]: [string, any], index) => (
          <Card key={decade} variant="purple">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
                <Calendar className="h-5 w-5" />
                {decade}
              </CardTitle>
              <CardDescription className="text-card-purple-foreground/70">
                {data.count} albums • {formatCurrency(data.value)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Disc className="h-3 w-3" />
                  <span>{data.cdCount} CD's</span>
                </div>
                <div className="flex items-center gap-1">
                  <Disc3 className="h-3 w-3" />
                  <span>{data.vinylCount} LP's</span>
                </div>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">Gemiddelde waarde</p>
                <p className="font-bold">{formatCurrency(data.count > 0 ? data.value / data.count : 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Top Genres</p>
                <div className="space-y-1">
                  {data.topGenres.slice(0, 3).map((genre) => (
                    <div key={genre.genre} className="flex justify-between text-xs">
                      <span className="truncate">{genre.genre}</span>
                      <Badge variant="secondary" className="text-xs">{genre.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-card-purple-foreground">Tijdlijn Overzicht</CardTitle>
          <CardDescription className="text-card-purple-foreground/70">Album releases door de jaren heen</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
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
    </>
  );
}

// Price Tab Component
function PriceTab({ stats, formatCurrency }: { stats: any; formatCurrency: (value: number) => string }) {
  const segments = [
    { key: 'budget', name: 'Budget (€0-10)', data: stats.valueSegments.budget, color: 'hsl(var(--muted))' },
    { key: 'midRange', name: 'Mid-Range (€10-50)', data: stats.valueSegments.midRange, color: 'hsl(var(--secondary))' },
    { key: 'premium', name: 'Premium (€50-100)', data: stats.valueSegments.premium, color: 'hsl(var(--primary))' },
    { key: 'collectors', name: "Collector's (€100+)", data: stats.valueSegments.collectors, color: 'hsl(var(--accent))' }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((segment, index) => (
          <Card key={segment.key} variant="purple">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-purple-foreground">
                <DollarSign className="h-5 w-5" />
                {segment.name}
              </CardTitle>
              <CardDescription className="text-card-purple-foreground/70">
                {segment.data.count} albums
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Gemiddelde Waarde</p>
                <p className="text-xl font-bold">{formatCurrency(segment.data.averageValue)}</p>
              </div>
              {segment.data.items.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Voorbeelden</p>
                  <div className="space-y-1">
                    {segment.data.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs">
                        <p className="font-medium truncate">{item.artist || 'Onbekend'}</p>
                        <p className="text-muted-foreground truncate">{item.title || 'Onbekend'}</p>
                        <p className="font-bold">{formatCurrency(item.median_price || item.calculated_advice_price || item.marketplace_price || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-card-purple-foreground">Waarde Verdeling</CardTitle>
          <CardDescription className="text-card-purple-foreground/70">Overzicht van prijsklassen in je collectie</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={segments.map(s => ({ name: s.name, count: s.data.count, value: s.data.count * s.data.averageValue }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === 'count' ? value : formatCurrency(Number(value)), name === 'count' ? 'Aantal Albums' : 'Totale Waarde']} />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-card-purple-foreground">Investment Insights</CardTitle>
          <CardDescription className="text-card-purple-foreground/70">Waardevolle items in je collectie</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artiest</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Waarde</TableHead>
                <TableHead>Categorie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.valueSegments.collectors.items.slice(0, 5).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.artist || 'Onbekend'}</TableCell>
                  <TableCell>{item.title || 'Onbekend'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.format === 'CD' ? <Disc className="h-3 w-3 mr-1" /> : <Disc3 className="h-3 w-3 mr-1" />}
                      {item.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(item.median_price || item.calculated_advice_price || item.marketplace_price || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge>Collector's</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
