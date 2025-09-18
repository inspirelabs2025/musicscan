import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Activity, Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { UserOverviewSection } from '@/components/admin/UserOverviewSection';
import { ScanActivitySection } from '@/components/admin/ScanActivitySection';
import { ContentAnalyticsSection } from '@/components/admin/ContentAnalyticsSection';
import { SystemHealthSection } from '@/components/admin/SystemHealthSection';
import { UserScansSection } from '@/components/admin/UserScansSection';

const SUPERADMIN_EMAIL = 'rogiervisser76@gmail.com';
const SECRET_KEY = 'superadmin_secret_2024';

const SuperAdminDashboard: React.FC = () => {
  console.log('🔐 SuperAdminDashboard: Component loading...');
  
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  console.log('🔐 SuperAdminDashboard: User state:', { 
    email: user?.email, 
    searchKey: searchParams.get('key') 
  });

  const { data: stats, isLoading, refetch } = useSuperAdminStats();

  // Check authorization
  useEffect(() => {
    const key = searchParams.get('key');
    const authorized = key === SECRET_KEY && user?.email === SUPERADMIN_EMAIL;
    console.log('🔐 SuperAdminDashboard: Authorization check:', {
      key,
      userEmail: user?.email,
      expectedEmail: SUPERADMIN_EMAIL,
      expectedKey: SECRET_KEY,
      authorized
    });
    setIsAuthorized(authorized);
  }, [searchParams, user]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Unauthorized access
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Toegang Geweigerd</CardTitle>
            <CardDescription>
              Deze pagina is alleen toegankelijk voor geautoriseerde beheerders.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Superadmin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Volledige systeemmonitoring en gebruikersactiviteit
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {stats?.totalUsers || 0} Gebruikers
            </Badge>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newUsersLast7Days || 0} laatste 7 dagen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Scans</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.scansToday || 0} vandaag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Scans</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.aiScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                AI foto scans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fouten</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                0
              </div>
              <p className="text-xs text-muted-foreground">
                Systeem fouten
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="users" key={refreshKey}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="user-scans">User Scans</TabsTrigger>
            <TabsTrigger value="scans">Scan Activiteit</TabsTrigger>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="system">Systeem Status</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserOverviewSection stats={stats} />
          </TabsContent>

          <TabsContent value="user-scans" className="mt-6">
            <UserScansSection stats={stats} />
          </TabsContent>

          <TabsContent value="scans" className="mt-6">
            <ScanActivitySection stats={stats} />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <ContentAnalyticsSection stats={stats} />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemHealthSection stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;