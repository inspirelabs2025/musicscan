import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';

interface TriggerConfig {
  enabled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'manual';
    time?: string;
    dayOfWeek?: number;
  };
  conditions?: {
    minContentItems?: number;
    requireNewContent?: boolean;
  };
}

interface EmailTriggerConfigProps {
  templateType: 'daily_digest' | 'weekly_discussion';
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

export const EmailTriggerConfig = ({ 
  templateType, 
  config, 
  onChange 
}: EmailTriggerConfigProps) => {
  const updateSchedule = (field: string, value: any) => {
    onChange({
      ...config,
      schedule: {
        ...config.schedule,
        [field]: value,
      } as any,
    });
  };

  const updateConditions = (field: string, value: any) => {
    onChange({
      ...config,
      conditions: {
        ...config.conditions,
        [field]: value,
      } as any,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Email Triggers
        </CardTitle>
        <CardDescription>
          Bepaal wanneer deze template gebruikt wordt voor email verzending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Automatische verzending</Label>
            <p className="text-sm text-muted-foreground">
              Schakel in voor geautomatiseerde emails
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          />
        </div>

        {config.enabled && (
          <>
            {/* Schedule */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Schema</Label>
              </div>
              
              <div>
                <Label className="text-sm">Frequentie</Label>
                <Select
                  value={config.schedule?.frequency || 'manual'}
                  onValueChange={(value: any) => updateSchedule('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Dagelijks</SelectItem>
                    <SelectItem value="weekly">Wekelijks</SelectItem>
                    <SelectItem value="manual">Handmatig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.schedule?.frequency === 'daily' && (
                <div>
                  <Label className="text-sm">Tijd</Label>
                  <Input
                    type="time"
                    value={config.schedule?.time || '09:00'}
                    onChange={(e) => updateSchedule('time', e.target.value)}
                  />
                </div>
              )}

              {config.schedule?.frequency === 'weekly' && (
                <>
                  <div>
                    <Label className="text-sm">Dag van de week</Label>
                    <Select
                      value={String(config.schedule?.dayOfWeek || 1)}
                      onValueChange={(value) => updateSchedule('dayOfWeek', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Maandag</SelectItem>
                        <SelectItem value="2">Dinsdag</SelectItem>
                        <SelectItem value="3">Woensdag</SelectItem>
                        <SelectItem value="4">Donderdag</SelectItem>
                        <SelectItem value="5">Vrijdag</SelectItem>
                        <SelectItem value="6">Zaterdag</SelectItem>
                        <SelectItem value="0">Zondag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Tijd</Label>
                    <Input
                      type="time"
                      value={config.schedule?.time || '09:00'}
                      onChange={(e) => updateSchedule('time', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Conditions */}
            {templateType === 'daily_digest' && (
              <div className="space-y-3 pt-2 border-t">
                <Label>Voorwaarden</Label>
                
                <div>
                  <Label className="text-sm">Min. aantal items</Label>
                  <Input
                    type="number"
                    min="0"
                    value={config.conditions?.minContentItems || 3}
                    onChange={(e) => updateConditions('minContentItems', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Verstuur alleen als er minimaal dit aantal nieuwe items is
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Alleen nieuwe content</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip als er geen nieuwe content is
                    </p>
                  </div>
                  <Switch
                    checked={config.conditions?.requireNewContent || false}
                    onCheckedChange={(checked) => updateConditions('requireNewContent', checked)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
