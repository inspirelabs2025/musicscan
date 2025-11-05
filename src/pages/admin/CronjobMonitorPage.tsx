import { CronjobMonitor } from "@/components/admin/CronjobMonitor";
import { DiscogsQueueMonitor } from "@/components/admin/DiscogsQueueMonitor";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
            <BreadcrumbPage>Cronjob Monitor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Cronjob Monitor</h1>
        <p className="text-muted-foreground">
          Real-time monitoring van alle cronjobs en queue processen
        </p>
      </div>

      <CronjobMonitor />

      <div className="pt-8">
        <DiscogsQueueMonitor />
      </div>
    </div>
  );
}
