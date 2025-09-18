import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, ChevronDown, ChevronRight, Search, Music, Disc, Camera } from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface UserScansSectionProps {
  stats?: SuperAdminStats;
}

export const UserScansSection: React.FC<UserScansSectionProps> = ({ stats }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  if (!stats) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Gegevens worden geladen...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Filter users based on search query
  const filteredUsers = stats.topUsers.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScanTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ai scan':
        return <Camera className="h-4 w-4" />;
      case 'cd scan':
        return <Disc className="h-4 w-4" />;
      case 'vinyl scan':
        return <Music className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getScanTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ai scan':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cd scan':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'vinyl scan':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Get recent activity for a specific user
  const getUserActivity = (userId: string) => {
    return stats.recentActivity.filter(activity => activity.user_id === userId).slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gebruiker Scans</h2>
          <p className="text-muted-foreground">
            Bekijk alle scans per gebruiker en hun activiteit
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek gebruiker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topUsers.length}</div>
            <p className="text-xs text-muted-foreground">Met scan activiteit</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gemiddeld per Gebruiker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topUsers.length > 0 
                ? Math.round(stats.totalScans / stats.topUsers.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Scans per actieve gebruiker</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recente Activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">Laatste 24 uur</p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Geen gebruikers gevonden met deze zoekopdracht.' : 'Geen gebruikers met scan activiteit.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.user_id);
            const userActivity = getUserActivity(user.user_id);
            
            return (
              <Card key={user.user_id}>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleUserExpanded(user.user_id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{user.first_name}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary" className="font-medium">
                              {user.scan_count} scans
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Recente Activiteit</h4>
                        
                        {userActivity.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Geen recente activiteit in de laatste 24 uur.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {userActivity.map((activity, index) => (
                              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    {getScanTypeIcon(activity.type)}
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getScanTypeBadgeColor(activity.type)}`}
                                    >
                                      {activity.type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">{activity.artist || 'Onbekende artiest'}</span>
                                    {activity.title && (
                                      <span className="text-muted-foreground"> - {activity.title}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(activity.created_at).toLocaleDateString('nl-NL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};