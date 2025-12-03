import { AdminGuard } from '@/components/admin/AdminGuard';
import { EmailDigestControl } from '@/components/admin/email/EmailDigestControl';
import { WeeklyDiscussionControl } from '@/components/admin/email/WeeklyDiscussionControl';
import { NotificationStatsOverview } from '@/components/admin/email/NotificationStatsOverview';
import { UserEmailPreferences } from '@/components/admin/email/UserEmailPreferences';
import { EmailLogsTable } from '@/components/admin/email/EmailLogsTable';
import { NewsletterSubscribersSection } from '@/components/admin/NewsletterSubscribersSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Bell, Users, FileText, Palette, Inbox } from 'lucide-react';
import { EmailTemplateCustomizer } from '@/components/admin/email/EmailTemplateCustomizer';

const EmailNotificationsPage = () => {
  return (
    <AdminGuard>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email & Communicatie Beheer</h1>
          <p className="text-muted-foreground">
            Beheer newsletter subscribers, gebruikersvoorkeuren, emails en notificaties
          </p>
        </div>

        <Tabs defaultValue="newsletter" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="newsletter" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Newsletter
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gebruikers
            </TabsTrigger>
            <TabsTrigger value="email-control" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Control
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Statistieken
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Email Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="newsletter" className="space-y-6">
            <NewsletterSubscribersSection />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserEmailPreferences />
          </TabsContent>

          <TabsContent value="email-control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmailDigestControl />
              <WeeklyDiscussionControl />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <EmailTemplateCustomizer />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationStatsOverview />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <EmailLogsTable />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
};

export default EmailNotificationsPage;
