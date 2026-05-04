import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./settings-forms/profile-form";
import { PasswordForm } from "./settings-forms/password-form";
import { UserPreferencesForm } from "./settings-forms/user-preferences";
import { IntegrationsForm } from "./settings-forms/integrations-form";
import { DangerZoneForm } from "./settings-forms/danger-zone-form";

const Profile: React.FC = () => {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20 max-w-5xl">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Mijn Profiel</h1>
        <p className="text-muted-foreground">
          Beheer je profielinstellingen, voorkeuren en account.
        </p>
      </div>
      <Separator className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profielinformatie</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wachtwoord wijzigen</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voorkeuren</CardTitle>
            </CardHeader>
            <CardContent>
              <UserPreferencesForm />
            </CardContent>
          </Card>

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
};

export default Profile;
