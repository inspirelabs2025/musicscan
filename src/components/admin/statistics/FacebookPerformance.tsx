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
import { Facebook, FileText, Newspaper, Music, Youtube, ShoppingBag, BookOpen, ExternalLink, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const CONTENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  blog_post: { label: 'Blog Posts', color: '#8b5cf6', icon: FileText },
  news: { label: 'Nieuws', color: '#3b82f6', icon: Newspaper },
  music_history: { label: 'Muziek Geschiedenis', color: '#22c55e', icon: Music },
  youtube: { label: 'YouTube', color: '#ef4444', icon: Youtube },
  product: { label: 'Producten', color: '#eab308', icon: ShoppingBag },
  anecdote: { label: 'Anekdotes', color: '#ec4899', icon: BookOpen },
  single: { label: 'Singles', color: '#06b6d4', icon: Music },
  daily_quiz: { label: 'Dagelijkse Quiz', color: '#f97316', icon: Calendar },
};

// Custom hook for Facebook posts with pagination
const useFacebookPosts = (filter: string | null, page: number, pageSize: number = 25) => {
  return useQuery({
    queryKey: ['facebook-posts', filter, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('facebook_post_log')
        .select('*', { count: 'exact' })
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

// Custom hook for category stats
const useFacebookCategoryStats = () => {
  return useQuery({
    queryKey: ['facebook-category-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_post_log')
        .select('content_type, status, created_at');
      
      if (error) throw error;
      
      const byType: Record<string, { total: number; success: number; failed: number; lastPost: string | null }> = {};
      
      data?.forEach(post => {
        const type = post.content_type || 'unknown';
        if (!byType[type]) {
          byType[type] = { total: 0, success: 0, failed: 0, lastPost: null };
        }
        byType[type].total++;
        if (post.status === 'success' || post.status === 'posted') {
          byType[type].success++;
        } else if (post.status === 'failed' || post.status === 'error') {
          byType[type].failed++;
        }
        if (!byType[type].lastPost || post.created_at > byType[type].lastPost!) {
          byType[type].lastPost = post.created_at;
        }
      });
      
      return {
        total: data?.length || 0,
        byType,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export function FacebookPerformance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data: stats, isLoading: statsLoading } = useFacebookCategoryStats();
  const { data: postsData, isLoading: postsLoading } = useFacebookPosts(categoryFilter, page, pageSize);

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
      fill: CONTENT_TYPE_CONFIG[type]?.color || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

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
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Totaal Posts</span>
              </div>
              <p className="text-3xl font-bold">{stats?.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          {chartData.slice(0, 3).map((item) => {
            const config = CONTENT_TYPE_CONFIG[item.type];
            const Icon = config?.icon || FileText;
            return (
              <Card key={item.type}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Icon className="h-4 w-4" style={{ color: item.fill }} />
                    <span className="text-xs">{item.name}</span>
                  </div>
                  <p className="text-3xl font-bold">{item.value.toLocaleString()}</p>
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
                  <TableHead className="text-right">Totaal</TableHead>
                  <TableHead className="text-right">Succes</TableHead>
                  <TableHead className="text-right">Gefaald</TableHead>
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
                      <TableCell className="text-right font-mono">{item.value.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{item.success.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{item.failed.toLocaleString()}</TableCell>
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