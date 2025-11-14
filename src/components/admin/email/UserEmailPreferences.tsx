import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export const UserEmailPreferences = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['user-email-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, email_notifications, auto_blog_generation, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth users for emails
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      return data.map(profile => {
        const authUser = authData?.users?.find((u: any) => u.id === profile.user_id);
        return {
          ...profile,
          email: authUser?.email || 'N/A'
        };
      });
    },
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ userId, field, value }: { userId: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-email-preferences'] });
      toast.success('Voorkeuren bijgewerkt');
    },
    onError: (error: any) => {
      toast.error('Fout bij bijwerken: ' + error.message);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-email-preferences'] });
      toast.success('Bulk update voltooid');
    },
    onError: (error: any) => {
      toast.error('Fout bij bulk update: ' + error.message);
    },
  });

  const handleExportCSV = () => {
    if (!users) return;

    const csv = [
      ['Email', 'First Name', 'Email Notifications', 'Auto Blog Generation', 'Created At'].join(','),
      ...users.map(u => [
        u.email,
        u.first_name,
        u.email_notifications ? 'Yes' : 'No',
        u.auto_blog_generation ? 'Yes' : 'No',
        new Date(u.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-email-preferences-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV geëxporteerd!');
  };

  const filteredUsers = users?.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emailNotificationsCount = users?.filter(u => u.email_notifications).length || 0;
  const autoBlogCount = users?.filter(u => u.auto_blog_generation).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Email Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>User Email Preferences</CardTitle>
            </div>
            <CardDescription>
              {users?.length || 0} totale gebruikers
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Email Notifications Enabled</p>
            <p className="text-2xl font-bold text-green-600">{emailNotificationsCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Auto Blog Enabled</p>
            <p className="text-2xl font-bold text-blue-600">{autoBlogCount}</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => bulkUpdateMutation.mutate({ field: 'email_notifications', value: true })}
            variant="outline"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Enable All Emails
          </Button>
          <Button
            onClick={() => bulkUpdateMutation.mutate({ field: 'email_notifications', value: false })}
            variant="outline"
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Disable All Emails
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Zoek op email of naam..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* User Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Naam</th>
                <th className="text-center p-2">Email Notifs</th>
                <th className="text-center p-2">Auto Blog</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.user_id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.first_name || '-'}</td>
                  <td className="text-center p-2">
                    <Switch
                      checked={user.email_notifications}
                      onCheckedChange={(checked) =>
                        updatePreferenceMutation.mutate({
                          userId: user.user_id,
                          field: 'email_notifications',
                          value: checked,
                        })
                      }
                    />
                  </td>
                  <td className="text-center p-2">
                    <Switch
                      checked={user.auto_blog_generation}
                      onCheckedChange={(checked) =>
                        updatePreferenceMutation.mutate({
                          userId: user.user_id,
                          field: 'auto_blog_generation',
                          value: checked,
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
