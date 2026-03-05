import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./settings-forms/profile-form";
import { IntegrationsForm } from "./settings-forms/integrations-form";
import { UserPreferencesForm } from "./settings-forms/user-preferences";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PasswordForm } from "./settings-forms/password-form";
import { TeamMembersForm } from "./settings-forms/team-members-form";
import { DangerZoneForm } from "./settings-forms/danger-zone-form";
import { useAIUsageTracker } from '@/hooks/use-ai-usage-tracker';
import { Button } from '@/components/ui/button';

export function Settings() {
  const { resetAIUsage } = useAIUsageTracker();

  return (
    <div className="flex-1 space-y-10 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Instellingen</h2>
      </div>
      <Separator />
      <div className="grid-cols-1 space-y-10 lg:grid lg:gap-10 lg:space-y-0 xl:grid-cols-2">
        <div className="space-y-10">
          <Card>
            <CardHeader>
              <CardTitle>Openbare Profiel Informatie</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamMembersForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Wachtwoord Wijzigen</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Instellingen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Reset je AI feature gebruiksstatistieken. Dit beïnvloedt alleen je lokale telling, niet de daadwerkelijke AI aanroepen.</p>
              <Button variant="outline" onClick={resetAIUsage}>Reset AI Gebruik</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          <Card>
            <CardHeader>
              <CardTitle>Integraties</CardTitle>
            </CardHeader>
            <CardContent>
              <IntegrationsForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gebruikersvoorkeuren</CardTitle>
            </CardHeader>
            <CardContent>
              <UserPreferencesForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gevarenzone</CardTitle>
            </CardHeader>
            <CardContent>
              <DangerZoneForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
