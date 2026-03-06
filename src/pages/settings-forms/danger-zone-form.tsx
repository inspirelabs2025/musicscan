import React from 'react';
import { Button } from '@/components/ui/button';

export const DangerZoneForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Account verwijderen en andere gevaarlijke acties.</p>
      <Button variant="destructive">Account verwijderen</Button>
    </div>
  );
};
