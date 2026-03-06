import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ProfileForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Weergavenaam</Label>
        <Input id="displayName" placeholder="Je weergavenaam" />
      </div>
      <Button>Opslaan</Button>
    </div>
  );
};
