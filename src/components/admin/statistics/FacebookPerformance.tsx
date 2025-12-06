import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Facebook, FileText, Newspaper, Music, Youtube, ShoppingBag, BookOpen, ExternalLink, Calendar, ChevronLeft, ChevronRight, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const CONTENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  blog_post: { label: 'Blog Posts', color: '#8b5cf6', icon: FileText },
  blog: { label: 'Blog Posts', color: '#8b5cf6', icon: FileText },
  news: { label: 'Nieuws', color: '#3b82f6', icon: Newspaper },
  music_history: { label: 'Muziek Geschiedenis', color: '#22c55e', icon: Music },
  youtube: { label: 'YouTube', color: '#ef4444', icon: Youtube },
  youtube_discovery: { label: 'YouTube', color: '#ef4444', icon: Youtube },
  product: { label: 'Producten', color: '#eab308', icon: ShoppingBag },
  anecdote: { label: 'Anekdotes', color: '#ec4899', icon: BookOpen },
  single: { label: 'Singles', color: '#06b6d4', icon: Music },
  daily_quiz: { label: 'Dagelijkse Quiz', color: '#f97316', icon: Calendar },
};

// Mapping to normalize content types for grouping
const CONTENT_TYPE_NORMALIZE: Record<string, string> = {
  blog: 'blog_post',
  youtube_discovery: 'youtube',
};

// Custom hook for Facebook posts with pagination
const useFacebookPosts = (filter: string | null, page: number, days: number, pageSize: number = 25) => {
  return useQuery({
    queryKey: ['facebook-posts', filter, page, days, pageSize],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let query = supabase
        .from('facebook_post_log')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (filter && filter !== 'all') {
        query = query.eq('content_type', filter);
      }
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return { posts: data || [], total: count || 0 };
    },
    staleTime: 60 * 1000,
  });
};

// Custom hook for category stats with created content counts
const useFacebookCategoryStats = (days: number) => {
  return useQuery({
    queryKey: ['facebook-category-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Fetch Facebook post stats (all time for created counts comparison)
      const { data: recentData, error: recentError } = await supabase
        .from('facebook_post_log')
        .select('content_type, status, created_at')
        .gte('created_at', startDate.toISOString());
      
      // Fetch all-time Facebook post stats for total posted comparison
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('facebook_post_log')
        .select('content_type, status, created_at');
      
      if (recentError) throw recentError;
      if (allTimeError) throw allTimeError;
      
      // Fetch created content counts from source tables WITH date filter
      const startDateStr = startDate.toISOString();
      
      const [
        singlesCount,
        blogCount,
        anecdotesCount,
        youtubeCount,
        productsCount,
        historyCount,
        quizCount
      ] = await Promise.all([
        supabase.from('music_stories').select('*', { count: 'exact', head: true }).not('single_name', 'is', null).gte('created_at', startDateStr),
        supabase.from('news_blog_posts').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
        supabase.from('music_anecdotes').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
        supabase.from('youtube_discoveries').select('*', { count: 'exact', head: true }).gte('discovered_at', startDateStr),
        supabase.from('platform_products').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
        supabase.from('music_history_events').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
        supabase.from('daily_challenges').select('*', { count: 'exact', head: true }).gte('created_at', startDateStr),
      ]);

      const createdCounts: Record<string, number> = {
        single: singlesCount.count || 0,
        blog_post: blogCount.count || 0,
        anecdote: anecdotesCount.count || 0,
        youtube: youtubeCount.count || 0,
        product: productsCount.count || 0,
        music_history: historyCount.count || 0,
        daily_quiz: quizCount.count || 0,
        news: blogCount.count || 0,
      };
      
      // Normalize and aggregate all-time posts by type
      const allTimeByType: Record<string, number> = {};
      allTimeData?.forEach(post => {
        const rawType = post.content_type || 'unknown';
        const normalizedType = CONTENT_TYPE_NORMALIZE[rawType] || rawType;
        allTimeByType[normalizedType] = (allTimeByType[normalizedType] || 0) + 1;
      });
      
      const byType: Record<string, { total: number; success: number; failed: number; lastPost: string | null; created: number; allTimePosted: number }> = {};
      
      // Process recent data for display
      recentData?.forEach(post => {
        const rawType = post.content_type || 'unknown';
        const normalizedType = CONTENT_TYPE_NORMALIZE[rawType] || rawType;
        
        if (!byType[normalizedType]) {
          byType[normalizedType] = { 
            total: 0, 
            success: 0, 
            failed: 0, 
            lastPost: null, 
            created: createdCounts[normalizedType] || 0,
            allTimePosted: allTimeByType[normalizedType] || 0
          };
        }
        byType[normalizedType].total++;
        if (post.status === 'success' || post.status === 'posted') {
          byType[normalizedType].success++;
        } else if (post.status === 'failed' || post.status === 'error') {
          byType[normalizedType].failed++;
        }
        if (!byType[normalizedType].lastPost || post.created_at > byType[normalizedType].lastPost!) {
          byType[normalizedType].lastPost = post.created_at;
        }
      });

      // Add created counts for types that have no recent posts but have content
      Object.entries(createdCounts).forEach(([type, count]) => {
        if (!byType[type] && count > 0) {
          byType[type] = { 
            total: 0, 
            success: 0, 
            failed: 0, 
            lastPost: null, 
            created: count,
            allTimePosted: allTimeByType[type] || 0
          };
        }
      });

      const totalCreated = Object.values(createdCounts).reduce((sum, c) => sum + c, 0);
      const totalAllTimePosted = Object.values(allTimeByType).reduce((sum, c) => sum + c, 0);
      
      return {
        total: recentData?.length || 0,
        totalCreated,
        totalAllTimePosted,
        byType,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

interface FacebookPerformanceProps {
  days: number;
}

export function FacebookPerformance({ days }: FacebookPerformanceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data: stats, isLoading: statsLoading } = useFacebookCategoryStats(days);
  const { data: postsData, isLoading: postsLoading } = useFacebookPosts(categoryFilter, page, days, pageSize);

  if (statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Post Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(stats?.byType || {})
    .map(([type, data]) => ({
      type,
      name: CONTENT_TYPE_CONFIG[type]?.label || type,
      value: data.total,
      success: data.success,
      failed: data.failed,
      created: data.created || 0,
      allTimePosted: data.allTimePosted || 0,
      fill: CONTENT_TYPE_CONFIG[type]?.color || '#6b7280',
    }))
    .filter(item => CONTENT_TYPE_CONFIG[item.type]) // Only show known types
    .sort((a, b) => b.created - a.created); // Sort by created content

  const pieData = chartData.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.fill,
  }));

  const totalPages = Math.ceil((postsData?.total || 0) / pageSize);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">📊 Overzicht</TabsTrigger>
        <TabsTrigger value="categories">📁 Per Categorie</TabsTrigger>
        <TabsTrigger value="posts">📋 Alle Posts</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <PenLine className="h-4 w-4 text-purple-600" />
                <span className="text-xs">Totaal Aangemaakt</span>
              </div>
              <p className="text-3xl font-bold">{stats?.totalCreated?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Totaal Geplaatst</span>
              </div>
              <p className="text-3xl font-bold">{stats?.totalAllTimePosted?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-xs">Conversie %</span>
              </div>
              <p className="text-3xl font-bold">
                {stats?.totalCreated && stats.totalCreated > 0 
                  ? ((stats.totalAllTimePosted / stats.totalCreated) * 100).toFixed(1) 
                  : '0'}%
              </p>
            </CardContent>
          </Card>
          {chartData.slice(0, 1).map((item) => {
            const config = CONTENT_TYPE_CONFIG[item.type];
            const Icon = config?.icon || FileText;
            return (
              <Card key={item.type}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Icon className="h-4 w-4" style={{ color: item.fill }} />
                    <span className="text-xs">Top: {item.name}</span>
                  </div>
                  <p className="text-3xl font-bold">{item.created.toLocaleString()}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Posts per Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Posts']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verdeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`pie-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Posts']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Categories Tab */}
      <TabsContent value="categories" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Statistieken per Categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">📝 Aangemaakt</TableHead>
                  <TableHead className="text-right">📤 Geplaatst</TableHead>
                  <TableHead className="text-right">Verschil</TableHead>
                  <TableHead className="text-right">Conversie %</TableHead>
                  <TableHead className="text-right">Succes %</TableHead>
                  <TableHead>Laatste Post</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((item) => {
                  const config = CONTENT_TYPE_CONFIG[item.type];
                  const Icon = config?.icon || FileText;
                  const successRate = item.value > 0 ? ((item.success / item.value) * 100).toFixed(1) : '0';
                  const conversionRate = item.created > 0 ? ((item.allTimePosted / item.created) * 100).toFixed(1) : '0';
                  const difference = item.created - item.allTimePosted;
                  const categoryData = stats?.byType?.[item.type];
                  
                  return (
                    <TableRow key={item.type}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1.5 rounded"
                            style={{ backgroundColor: `${item.fill}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: item.fill }} />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-600">{item.created.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-blue-600">{item.allTimePosted.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">
                        {difference > 0 ? (
                          <span className="text-orange-600">-{difference.toLocaleString()}</span>
                        ) : difference < 0 ? (
                          <span className="text-green-600">+{Math.abs(difference).toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={parseFloat(conversionRate) >= 100 ? 'default' : parseFloat(conversionRate) > 50 ? 'secondary' : 'outline'}>
                          {conversionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={parseFloat(successRate) > 90 ? 'default' : parseFloat(successRate) > 70 ? 'secondary' : 'destructive'}>
                          {successRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {categoryData?.lastPost 
                          ? format(new Date(categoryData.lastPost), 'd MMM HH:mm', { locale: nl })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setCategoryFilter(item.type);
                            setPage(0);
                            setActiveTab('posts');
                          }}
                        >
                          Bekijk →
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Posts List Tab */}
      <TabsContent value="posts" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Facebook Posts</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={categoryFilter === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => { setCategoryFilter('all'); setPage(0); }}
                  >
                    Alle
                  </Button>
                  {Object.entries(CONTENT_TYPE_CONFIG).slice(0, 6).map(([type, config]) => (
                    <Button
                      key={type}
                      variant={categoryFilter === type ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => { setCategoryFilter(type); setPage(0); }}
                      className="gap-1"
                    >
                      <config.icon className="h-3 w-3" style={{ color: config.color }} />
                      <span className="hidden lg:inline">{config.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsData?.posts.map((post: any) => {
                      const config = CONTENT_TYPE_CONFIG[post.content_type] || { 
                        label: post.content_type, 
                        color: '#6b7280', 
                        icon: FileText 
                      };
                      const Icon = config.icon;
                      const isSuccess = post.status === 'success' || post.status === 'posted';
                      
                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="p-1.5 rounded"
                                style={{ backgroundColor: `${config.color}20` }}
                              >
                                <Icon className="h-4 w-4" style={{ color: config.color }} />
                              </div>
                              <span className="text-sm">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {post.title || post.content?.substring(0, 50) || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isSuccess ? 'default' : 'destructive'}>
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {format(new Date(post.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                          </TableCell>
                          <TableCell>
                            {post.facebook_post_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={`https://facebook.com/${post.facebook_post_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {postsData?.total.toLocaleString()} posts totaal
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Pagina {page + 1} van {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}