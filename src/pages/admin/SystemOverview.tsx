import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Database, 
  Clock, 
  Zap, 
  Route, 
  RefreshCw, 
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Server,
  BarChart3
} from "lucide-react";
import { useSystemOverview } from "@/hooks/useSystemOverview";
import { SCHEDULED_CRONJOBS } from "@/hooks/useCronjobExecutionLog";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export default function SystemOverview() {
  const {
    databaseStats,
    statsByCategory,
    statsLoading,
    refetchStats,
    cronjobSummary,
    edgeFunctionsByCategory,
    publicRoutesByCategory,
    adminRoutesByCategory,
    totalEdgeFunctions,
    totalPublicRoutes,
    totalAdminRoutes,
  } = useSystemOverview();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const totalRecords = databaseStats?.reduce((sum, stat) => sum + stat.count, 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'running':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Content': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Shop': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Community': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Scans': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'Import': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'SEO': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'Art': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'Email': 'bg-red-500/10 text-red-500 border-red-500/20',
      'AI': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      'Utility': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Overview</h1>
          <p className="text-muted-foreground">Volledig overzicht van het MusicScan platform</p>
        </div>
        <Button variant="outline" onClick={() => refetchStats()} disabled={statsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              Database Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{databaseStats?.length || 0} tabellen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              Cronjobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SCHEDULED_CRONJOBS.length}</div>
            <p className="text-xs text-muted-foreground">Actieve taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEdgeFunctions}</div>
            <p className="text-xs text-muted-foreground">{Object.keys(edgeFunctionsByCategory).length} categorieën</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Route className="w-4 h-4 text-purple-500" />
              Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPublicRoutes + totalAdminRoutes}</div>
            <p className="text-xs text-muted-foreground">{totalPublicRoutes} publiek, {totalAdminRoutes} admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="cronjobs" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Cronjobs</span>
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Functions</span>
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Routes</span>
          </TabsTrigger>
          <TabsTrigger value="dataflow" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Data Flow</span>
          </TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistieken</CardTitle>
              <CardDescription>Real-time overzicht van alle database tabellen per categorie</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(statsByCategory).map(([category, stats]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Badge variant="outline" className={getCategoryColor(category)}>{category}</Badge>
                        <span className="text-muted-foreground text-sm">
                          ({stats.reduce((sum, s) => sum + s.count, 0).toLocaleString()} records)
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {stats.map((stat) => (
                          <Card key={stat.table} className="hover:bg-muted/50 transition-colors">
                            {stat.route ? (
                              <Link to={stat.route}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xl">{stat.icon}</span>
                                    {stat.count < 10 && stat.category !== 'Import' && (
                                      <Badge variant="destructive" className="text-xs">Low</Badge>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-xl font-bold">{stat.count.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                                  </div>
                                </CardContent>
                              </Link>
                            ) : (
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl">{stat.icon}</span>
                                  {stat.count < 10 && stat.category !== 'Import' && (
                                    <Badge variant="destructive" className="text-xs">Low</Badge>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <div className="text-xl font-bold">{stat.count.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cronjobs Tab */}
        <TabsContent value="cronjobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scheduled Cronjobs</CardTitle>
                <CardDescription>Alle {SCHEDULED_CRONJOBS.length} geplande taken met hun schema en status</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/cronjob-monitor">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Volledige Monitor
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Functie</TableHead>
                      <TableHead>Schema</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Laatste Run</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SCHEDULED_CRONJOBS.map((job) => {
                      const stats = cronjobSummary?.[job.name];
                      return (
                        <TableRow key={job.name}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.name}</div>
                              <div className="text-xs text-muted-foreground max-w-md truncate">{job.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{job.schedule}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getCategoryColor(job.category)}>
                              {job.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stats?.lastRun ? formatDistanceToNow(new Date(stats.lastRun), { addSuffix: true, locale: nl }) : '-'}
                          </TableCell>
                          <TableCell>
                            {stats ? getStatusBadge(stats.lastStatus) : <Badge variant="outline">Geen data</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edge Functions Tab */}
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Functions Catalogus</CardTitle>
              <CardDescription>{totalEdgeFunctions} functies in {Object.keys(edgeFunctionsByCategory).length} categorieën</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(edgeFunctionsByCategory).map(([category, functions]) => (
                  <Collapsible
                    key={category}
                    open={expandedCategories[category]}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getCategoryColor(category)}>
                            {category}
                          </Badge>
                          <span className="text-muted-foreground">{functions.length} functies</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 pt-0">
                        {functions.map((fn) => (
                          <div key={fn.name} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                            <Zap className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                            <div>
                              <div className="font-mono text-sm">{fn.name}</div>
                              {fn.description && (
                                <div className="text-xs text-muted-foreground">{fn.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Public Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-green-500" />
                  Publieke Routes
                </CardTitle>
                <CardDescription>{totalPublicRoutes} routes voor bezoekers</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {Object.entries(publicRoutesByCategory).map(([category, routes]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                        <div className="space-y-1">
                          {routes.map((route) => (
                            <div key={route.path} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                              <div>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{route.path}</code>
                                <span className="ml-2 text-sm">{route.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Admin Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-orange-500" />
                  Admin Routes
                </CardTitle>
                <CardDescription>{totalAdminRoutes} admin pagina's</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {Object.entries(adminRoutesByCategory).map(([category, routes]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                        <div className="space-y-1">
                          {routes.map((route) => (
                            <Link
                              key={route.path}
                              to={route.path}
                              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 group"
                            >
                              <div>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{route.path}</code>
                                <span className="ml-2 text-sm">{route.title}</span>
                              </div>
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Flow Tab */}
        <TabsContent value="dataflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Data Flow
              </CardTitle>
              <CardDescription>Visueel overzicht van hoe data door het systeem stroomt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                {/* Sources */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-center pb-2 border-b">📥 Bronnen</h3>
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🎵</div>
                      <div className="font-medium text-sm">Discogs API</div>
                      <div className="text-xs text-muted-foreground">Releases & prijzen</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">📰</div>
                      <div className="font-medium text-sm">RSS Feeds</div>
                      <div className="text-xs text-muted-foreground">Muzieknieuws</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">👤</div>
                      <div className="font-medium text-sm">User Uploads</div>
                      <div className="text-xs text-muted-foreground">Scans & fotos</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Processing */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-center pb-2 border-b">⚙️ Verwerking</h3>
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">📋</div>
                      <div className="font-medium text-sm">Import Queue</div>
                      <div className="text-xs text-muted-foreground">Discogs crawler</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🤖</div>
                      <div className="font-medium text-sm">AI Generation</div>
                      <div className="text-xs text-muted-foreground">OpenAI & Gemini</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🔄</div>
                      <div className="font-medium text-sm">Batch Processor</div>
                      <div className="text-xs text-muted-foreground">Cronjobs</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Output */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-center pb-2 border-b">📤 Output</h3>
                  <Card className="bg-cyan-500/10 border-cyan-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">📝</div>
                      <div className="font-medium text-sm">Blog Posts</div>
                      <div className="text-xs text-muted-foreground">{databaseStats?.find(s => s.table === 'blog_posts')?.count.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-pink-500/10 border-pink-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🛍️</div>
                      <div className="font-medium text-sm">Products</div>
                      <div className="text-xs text-muted-foreground">{databaseStats?.find(s => s.table === 'platform_products')?.count.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-violet-500/10 border-violet-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🎤</div>
                      <div className="font-medium text-sm">Artist Stories</div>
                      <div className="text-xs text-muted-foreground">{databaseStats?.find(s => s.table === 'artist_stories')?.count.toLocaleString() || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* SEO */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-center pb-2 border-b">🔍 SEO</h3>
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🗺️</div>
                      <div className="font-medium text-sm">Sitemaps</div>
                      <div className="text-xs text-muted-foreground">Auto-generated</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-teal-500/10 border-teal-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">📡</div>
                      <div className="font-medium text-sm">IndexNow</div>
                      <div className="text-xs text-muted-foreground">Real-time indexing</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-lime-500/10 border-lime-500/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">🔑</div>
                      <div className="font-medium text-sm">Keywords</div>
                      <div className="text-xs text-muted-foreground">Auto-generated</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Flow arrows visual description */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Data Flow Beschrijving:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li><strong>Bronnen → Queue:</strong> Discogs crawler haalt releases op, RSS feeds worden gescraped, gebruikers uploaden scans</li>
                  <li><strong>Queue → AI:</strong> Items worden verwerkt door AI voor content generatie (blogs, descriptions, art)</li>
                  <li><strong>AI → Output:</strong> Gegenereerde content wordt opgeslagen als blog posts, products, en stories</li>
                  <li><strong>Output → SEO:</strong> Nieuwe content triggert sitemap updates en IndexNow submissions</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
