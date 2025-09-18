import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, Calendar, Activity } from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface UserOverviewSectionProps {
  stats?: SuperAdminStats;
}

export const UserOverviewSection: React.FC<UserOverviewSectionProps> = ({ stats }) => {
  if (!stats) return <div>Laden...</div>;

  return (
    <div className="space-y-6">
      {/* User Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nieuwe Gebruikers (7d)</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.newUsersLast7Days}</div>
            <p className="text-xs text-muted-foreground">
              Groei van {Math.round((stats.newUsersLast7Days / Math.max(stats.totalUsers, 1)) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nieuwe Gebruikers (30d)</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newUsersLast30Days}</div>
            <p className="text-xs text-muted-foreground">
              Maandelijkse groei
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde per dag</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.newUsersLast30Days / 30 * 10) / 10}
            </div>
            <p className="text-xs text-muted-foreground">
              Gebruikers per dag (30d gemiddelde)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meest Actieve Gebruikers
          </CardTitle>
          <CardDescription>
            Gebruikers gesorteerd op aantal scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topUsers.slice(0, 10).map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Laatste activiteit: {new Date(user.lastActive).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{user.scanCount}</p>
                  <p className="text-sm text-muted-foreground">scans</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gebruikers Verdeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Totaal geregistreerd</span>
                <Badge variant="outline">{stats.totalUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Actief laatste maand</span>
                <Badge variant="secondary">{stats.newUsersLast30Days}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Met scans</span>
                <Badge variant="default">
                  {stats.topUsers.filter(u => u.scanCount > 0).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activiteit Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Groei laatste week</span>
                <Badge variant={stats.newUsersLast7Days > 0 ? 'default' : 'secondary'}>
                  +{stats.newUsersLast7Days}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Totaal scans vandaag</span>
                <Badge variant="outline">{stats.scansToday}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Actieve scanners</span>
                <Badge variant="default">
                  {stats.topUsers.filter(u => u.scanCount > 5).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};