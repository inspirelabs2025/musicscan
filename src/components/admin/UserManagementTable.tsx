import { useState } from 'react';
import { UserWithRoles } from '@/hooks/useUserManagement';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Shield, UserMinus, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserManagementTableProps {
  users: UserWithRoles[];
  onAssignRole: (userId: string, role: string) => Promise<boolean>;
  onRemoveRole: (userId: string, role: string) => Promise<boolean>;
}

const ROLE_COLORS = {
  admin: 'destructive',
  moderator: 'default',
  user: 'secondary',
} as const;

const AVAILABLE_ROLES = ['admin', 'moderator', 'user'] as const;

export function UserManagementTable({ users, onAssignRole, onRemoveRole }: UserManagementTableProps) {
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'assign' | 'remove';
    userId: string;
    role: string;
    userEmail: string;
  } | null>(null);

  const handleConfirmAction = async () => {
    if (!actionDialog) return;

    const success = actionDialog.action === 'assign'
      ? await onAssignRole(actionDialog.userId, actionDialog.role)
      : await onRemoveRole(actionDialog.userId, actionDialog.role);

    if (success) {
      setActionDialog(null);
    }
  };

  const openAssignDialog = (userId: string, role: string, userEmail: string) => {
    setActionDialog({
      open: true,
      action: 'assign',
      userId,
      role,
      userEmail,
    });
  };

  const openRemoveDialog = (userId: string, role: string, userEmail: string) => {
    setActionDialog({
      open: true,
      action: 'remove',
      userId,
      role,
      userEmail,
    });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.first_name?.[0] || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.first_name || 'No name'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={ROLE_COLORS[role as keyof typeof ROLE_COLORS]}
                            className="flex items-center gap-1"
                          >
                            <Shield className="h-3 w-3" />
                            {role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_sign_in_at
                      ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Manage Roles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Assign Roles */}
                        {AVAILABLE_ROLES.filter(role => !user.roles.includes(role)).length > 0 && (
                          <>
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                              Assign Role
                            </DropdownMenuLabel>
                            {AVAILABLE_ROLES.filter(role => !user.roles.includes(role)).map((role) => (
                              <DropdownMenuItem
                                key={`assign-${role}`}
                                onClick={() => openAssignDialog(user.id, role, user.email)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add {role}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}

                        {/* Remove Roles */}
                        {user.roles.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                              Remove Role
                            </DropdownMenuLabel>
                            {user.roles.map((role) => (
                              <DropdownMenuItem
                                key={`remove-${role}`}
                                onClick={() => openRemoveDialog(user.id, role, user.email)}
                                className="text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove {role}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.action === 'assign' ? 'Assign Role' : 'Remove Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.action === 'assign' ? (
                <>
                  Are you sure you want to assign the <strong>{actionDialog.role}</strong> role to{' '}
                  <strong>{actionDialog.userEmail}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to remove the <strong>{actionDialog?.role}</strong> role from{' '}
                  <strong>{actionDialog?.userEmail}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
