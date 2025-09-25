import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Search, 
  Clock, 
  MessageSquare, 
  Music, 
  ShoppingCart, 
  Heart,
  Disc,
  FileText,
  Trophy,
  UserPlus,
  Eye,
  Calendar
} from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface UserActivitiesProps {
  stats?: SuperAdminStats;
}

export const UserActivitiesSection: React.FC<UserActivitiesProps> = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  if (!stats) return <div>Laden...</div>;

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ai scan':
      case 'ai_scan':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'cd scan':
      case 'cd_scan':
        return <Disc className="h-4 w-4 text-green-500" />;
      case 'vinyl scan':
      case 'vinyl_scan':
        return <Music className="h-4 w-4 text-purple-500" />;
      case 'blog_post':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'quiz_result':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-pink-500" />;
      case 'shop_order':
        return <ShoppingCart className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ai scan':
      case 'ai_scan':
        return 'text-blue-600 bg-blue-50';
      case 'cd scan':
      case 'cd_scan':
        return 'text-green-600 bg-green-50';
      case 'vinyl scan':
      case 'vinyl_scan':
        return 'text-purple-600 bg-purple-50';
      case 'blog_post':
        return 'text-orange-600 bg-orange-50';
      case 'quiz_result':
        return 'text-yellow-600 bg-yellow-50';
      case 'follow':
        return 'text-pink-600 bg-pink-50';
      case 'shop_order':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatActivityDescription = (activity: any) => {
    switch (activity.type.toLowerCase()) {
      case 'ai scan':
      case 'ai_scan':
        return `AI scan van ${activity.artist || 'Unknown'} - ${activity.title || 'Unknown'}`;
      case 'cd scan':
      case 'cd_scan':
        return `CD scan van ${activity.artist || 'Unknown'} - ${activity.title || 'Unknown'}`;
      case 'vinyl scan':
      case 'vinyl_scan':
        return `Vinyl scan van ${activity.artist || 'Unknown'} - ${activity.title || 'Unknown'}`;
      case 'blog_post':
        return `Blog post gepubliceerd: ${activity.title || 'Untitled'}`;
      case 'quiz_result':
        return `Quiz voltooid: ${activity.score_percentage || 0}% score`;
      case 'follow':
        return `Nieuwe follow actie`;
      case 'shop_order':
        return `Shop bestelling geplaatst`;
      default:
        return `${activity.type} activiteit`;
    }
  };

  const filteredActivities = stats.userActivities?.filter((activity: any) => {
    const matchesSearch = !searchTerm || 
      activity.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const now = new Date();
    const activityDate = new Date(activity.created_at);
    let timeMatch = true;
    
    switch (timeFilter) {
      case '1h':
        timeMatch = activityDate >= new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeMatch = activityDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeMatch = activityDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeMatch = activityDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return matchesSearch && timeMatch;
  }) || [];

  const activityStats = {
    totalActivities: stats.userActivities?.length || 0,
    activitiesLast24h: stats.userActivities?.filter((a: any) => 
      new Date(a.created_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length || 0,
    uniqueActiveUsers: new Set(stats.userActivities?.map((a: any) => a.user_id) || []).size,
    mostActiveUser: stats.topUsers?.[0] || null
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Activiteiten</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Alle gebruikersactiviteiten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laatste 24u</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activityStats.activitiesLast24h}</div>
            <p className="text-xs text-muted-foreground">
              Activiteiten vandaag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activityStats.uniqueActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Unieke actieve gebruikers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meest Actief</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">
              {activityStats.mostActiveUser?.first_name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {activityStats.mostActiveUser?.scan_count || 0} scans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Gebruikersactiviteiten
          </CardTitle>
          <CardDescription>
            Realtime overzicht van alle gebruikersactiviteiten op het platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op gebruiker, artiest, titel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {(['1h', '24h', '7d', '30d'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={timeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter === '1h' && 'Laatste uur'}
                  {filter === '24h' && 'Laatste 24u'}
                  {filter === '7d' && 'Laatste week'}
                  {filter === '30d' && 'Laatste maand'}
                </Button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-4 opacity-50" />
                  <p>Geen activiteiten gevonden voor de geselecteerde filters</p>
                </div>
              ) : (
                filteredActivities.map((activity: any, index: number) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">
                            {activity.user_email || 'Unknown User'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString('nl-NL')}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatActivityDescription(activity)}
                        </p>
                        
                        {activity.metadata && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(activity.metadata).slice(0, 3).map(([key, value]: [string, any]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value).slice(0, 20)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(activity)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activiteit Types</CardTitle>
            <CardDescription>Verdeling van activiteiten per type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['AI Scan', 'CD Scan', 'Vinyl Scan', 'Blog Post', 'Quiz', 'Follow', 'Shop Order'].map((type) => {
                const count = stats.userActivities?.filter((a: any) => 
                  a.type.toLowerCase().includes(type.toLowerCase())
                ).length || 0;
                const percentage = Math.round((count / (stats.userActivities?.length || 1)) * 100);
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(type)}
                      <span className="text-sm">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activiteit Timeline</CardTitle>
            <CardDescription>Activiteiten over tijd</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Laatste uur', 'Laatste 6 uur', 'Laatste 24 uur', 'Laatste week'].map((period, index) => {
                const hours = [1, 6, 24, 168][index];
                const count = stats.userActivities?.filter((a: any) => 
                  new Date(a.created_at) >= new Date(Date.now() - hours * 60 * 60 * 1000)
                ).length || 0;
                
                return (
                  <div key={period} className="flex items-center justify-between">
                    <span className="text-sm">{period}</span>
                    <Badge variant={count > 0 ? 'default' : 'secondary'}>
                      {count} activiteiten
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Activiteit Details</DialogTitle>
              <DialogDescription>
                Gedetailleerde informatie over deze gebruikersactiviteit
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Gebruiker</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge variant="outline">{selectedUser.type}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Tijd</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.created_at).toLocaleString('nl-NL')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Activiteit ID</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedUser.activity_id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Beschrijving</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatActivityDescription(selectedUser)}
                </p>
              </div>
              
              {selectedUser.metadata && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedUser.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};