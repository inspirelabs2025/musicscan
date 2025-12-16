import { CronjobCommandCenter } from "@/components/admin/CronjobCommandCenter";
import { CronjobDashboard } from "@/components/admin/CronjobDashboard";
import { CronjobMonitor } from "@/components/admin/CronjobMonitor";
import { DiscogsQueueMonitor } from "@/components/admin/DiscogsQueueMonitor";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

export default function CronjobMonitorPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cronjob Command Center</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Cronjob Command Center</h1>
        <p className="text-muted-foreground">
          Gecentraliseerd overzicht van alle {30} scheduled functions, queues en alerts
        </p>
      </div>

      <Tabs defaultValue="command-center" className="space-y-6">
        <TabsList>
          <TabsTrigger value="command-center">Command Center</TabsTrigger>
          <TabsTrigger value="legacy-dashboard">Legacy Dashboard</TabsTrigger>
          <TabsTrigger value="legacy-monitor">Legacy Monitor</TabsTrigger>
          <TabsTrigger value="discogs">Discogs Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="command-center">
          <CronjobCommandCenter />
        </TabsContent>

        <TabsContent value="legacy-dashboard">
          <CronjobDashboard />
        </TabsContent>

        <TabsContent value="legacy-monitor">
          <CronjobMonitor />
        </TabsContent>

        <TabsContent value="discogs">
          <DiscogsQueueMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
