import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  first_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const requestBody: any = { action: 'list' };
      if (searchQuery) requestBody.search = searchQuery;
      if (roleFilter && roleFilter !== 'all') requestBody.role = roleFilter;

      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: requestBody,
      });

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      let errorMessage = 'Failed to fetch users';
      
      if (error.message?.includes('Unauthorized')) {
        errorMessage = 'Je bent niet ingelogd. Log in als admin gebruiker.';
      } else if (error.message?.includes('Forbidden')) {
        errorMessage = 'Je hebt geen admin rechten. Vraag een admin om je de admin rol te geven.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'assign', userId, role },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role "${role}" assigned successfully`,
      });

      // Refresh users list
      await fetchUsers();
      
      return true;
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'remove', userId, role },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role "${role}" removed successfully`,
      });

      // Refresh users list
      await fetchUsers();
      
      return true;
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  // Subscribe to real-time changes in user_roles table
  useEffect(() => {
    const channel = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery, roleFilter]);

  return {
    users,
    loading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    assignRole,
    removeRole,
    refetch: fetchUsers,
  };
};
