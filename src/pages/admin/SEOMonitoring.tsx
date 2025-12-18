import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SitemapStatus } from "@/components/admin/SEOSitemapStatus";
import { IndexNowQueueMonitor } from "@/components/admin/IndexNowQueueMonitor";
import { IndexNowMonitor } from "@/components/admin/IndexNowMonitor";
import { GoogleIndexMonitor } from "@/components/admin/GoogleIndexMonitor";
import { PriceChangeMonitor } from "@/components/admin/PriceChangeMonitor";
import { ContentFreshnessOverview } from "@/components/admin/ContentFreshnessOverview";
import { SEOHealthCheck } from "@/components/admin/SEOHealthCheck";
import { PerformanceMonitor } from "@/components/admin/PerformanceMonitor";
import { useWebVitals } from "@/hooks/useWebVitals";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { AutoIndexNowSubmitter } from "@/components/admin/AutoIndexNowSubmitter";
import { ImportAuditWidget } from "@/components/admin/ImportAuditWidget";
import { CanonicalChecker } from "@/components/admin/CanonicalChecker";
import { CrawledNotIndexedAnalyzer } from "@/components/admin/CrawledNotIndexedAnalyzer";

export default function SEOMonitoring() {
  // Initialize web vitals tracking
  useWebVitals();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SEO Monitoring</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold mb-2">SEO Monitoring Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor en beheer alle SEO-gerelateerde processen en statistieken
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crawled-not-indexed">Crawled Not Indexed</TabsTrigger>
          <TabsTrigger value="google">Google Index</TabsTrigger>
          <TabsTrigger value="sitemaps">Sitemaps</TabsTrigger>
          <TabsTrigger value="indexnow">IndexNow</TabsTrigger>
          <TabsTrigger value="canonicals">Canonicals</TabsTrigger>
          <TabsTrigger value="prices">Price Changes</TabsTrigger>
          <TabsTrigger value="content">Content Freshness</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SEOHealthCheck />
        </TabsContent>

        <TabsContent value="crawled-not-indexed" className="space-y-4">
          <CrawledNotIndexedAnalyzer />
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <GoogleIndexMonitor />
        </TabsContent>

        <TabsContent value="sitemaps" className="space-y-4">
          <SitemapStatus />
        </TabsContent>

        <TabsContent value="indexnow" className="space-y-4">
          <AutoIndexNowSubmitter />
          <ImportAuditWidget />
          <IndexNowMonitor />
          <IndexNowQueueMonitor />
        </TabsContent>

        <TabsContent value="canonicals" className="space-y-4">
          <CanonicalChecker />
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <PriceChangeMonitor />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentFreshnessOverview />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
