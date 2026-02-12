import { useState } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { UserDetailDialog } from '@/components/admin/UserDetailDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, RefreshCw, Users as UsersIcon, Camera, CheckCircle, XCircle, AlertTriangle, Calendar, TrendingUp, Disc } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function UserManagement() {

// Scan stats hook
function useScanStats() {
  return useQuery({
    queryKey: ['admin-scan-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_scan_stats');
      if (error) throw error;
      return data as {
        total_scans: number;
        ai_scans_total: number;
        ai_scans_completed: number;
        ai_scans_failed: number;
        ai_scans_no_match: number;
        ai_scans_pending: number;
        cd_scans_total: number;
        vinyl_scans_total: number;
        unique_scanners: number;
        scans_today: number;
        scans_this_week: number;
        scans_this_month: number;
      };
    },
    staleTime: 30_000,
  });
}

function ScanStatsCards() {
  const { data: stats, isLoading } = useScanStats();
  if (isLoading) return <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  if (!stats) return null;

  const successRate = stats.ai_scans_total > 0 
    ? Math.round((stats.ai_scans_completed / stats.ai_scans_total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Camera className="h-5 w-5" /> Scan Statistieken</h2>
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Totaal Scans</CardDescription>
            <CardTitle className="text-2xl">{stats.total_scans.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">AI: {stats.ai_scans_total} · CD: {stats.cd_scans_total} · Vinyl: {stats.vinyl_scans_total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Succesvol</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.ai_scans_completed.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">{successRate}% success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" /> Mislukt</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.ai_scans_failed.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Geen Match</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.ai_scans_no_match.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Disc className="h-3.5 w-3.5" /> Unieke Scanners</CardDescription>
            <CardTitle className="text-2xl">{stats.unique_scanners}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Vandaag / Week / Maand</CardDescription>
            <CardTitle className="text-lg">{stats.scans_today} / {stats.scans_this_week} / {stats.scans_this_month}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

  const {
    users,
    loading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    assignRole,
    removeRole,
    refetch,
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Scan Statistics */}
      <ScanStatsCards />

      {/* User Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.roles.includes('admin')).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Moderators</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.roles.includes('moderator')).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No Roles</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.roles.length === 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || roleFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <UserManagementTable
              users={users}
              onAssignRole={assignRole}
              onRemoveRole={removeRole}
              onUserClick={handleUserClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
