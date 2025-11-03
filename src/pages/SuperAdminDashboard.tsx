import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { UserActivitiesSection } from '@/components/admin/UserActivitiesSection';
import { TestEmailTrigger } from '@/components/TestEmailTrigger';
import { ArtworkStatusSection } from '@/components/admin/ArtworkStatusSection';
import { PodcastManagementSection } from '@/components/admin/PodcastManagementSection';
import { IndexNowMonitor } from '@/components/admin/IndexNowMonitor';

const SuperAdminDashboard: React.FC = () => {
  console.log('🔐 SuperAdminDashboard: Component loading...');
  
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats, isLoading, refetch } = useSuperAdminStats();

  // Check authorization via database role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) {
        console.log('🔐 SuperAdminDashboard: No user logged in');
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        console.log('🔐 SuperAdminDashboard: Checking admin role for user:', user.email);
        
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('🔐 SuperAdminDashboard: Role check error:', error);
          setIsAuthorized(false);
        } else {
          console.log('🔐 SuperAdminDashboard: Admin role check result:', data);
          setIsAuthorized(data === true);
        }
      } catch (error) {
        console.error('🔐 SuperAdminDashboard: Exception during role check:', error);
        setIsAuthorized(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Show loading state while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4 animate-pulse" />
            <CardTitle>Authorisatie Controleren...</CardTitle>
            <CardDescription>
              Even geduld, we verifiëren je toegangsrechten.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="activities">User Activities</TabsTrigger>
            <TabsTrigger value="user-scans">User Scans</TabsTrigger>
            <TabsTrigger value="scans">Scan Activiteit</TabsTrigger>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="system">Systeem Status</TabsTrigger>
            <TabsTrigger value="artwork">Artwork Status</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
            <TabsTrigger value="indexnow">IndexNow</TabsTrigger>
            <TabsTrigger value="email">Email Test</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserOverviewSection stats={stats} />
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <UserActivitiesSection stats={stats} />
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

          <TabsContent value="artwork" className="mt-6">
            <ArtworkStatusSection stats={stats} />
          </TabsContent>

          <TabsContent value="podcasts" className="mt-6">
            <PodcastManagementSection />
          </TabsContent>

          <TabsContent value="indexnow" className="mt-6">
            <IndexNowMonitor />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <TestEmailTrigger />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;