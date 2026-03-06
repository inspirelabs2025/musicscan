import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const PasswordForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
        <Input id="newPassword" type="password" placeholder="••••••••" />
      </div>
      <Button>Wachtwoord wijzigen</Button>
    </div>
  );
};
