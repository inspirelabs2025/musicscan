import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrafficOverview } from '@/components/admin/statistics/TrafficOverview';
import { TrafficSourcesChart } from '@/components/admin/statistics/TrafficSourcesChart';
import { ContentPerformance } from '@/components/admin/statistics/ContentPerformance';
import { DeviceBreakdownChart } from '@/components/admin/statistics/DeviceBreakdownChart';
import { TimeAnalysis } from '@/components/admin/statistics/TimeAnalysis';
import { FacebookPerformance } from '@/components/admin/statistics/FacebookPerformance';
import { GrowthMetrics } from '@/components/admin/statistics/GrowthMetrics';
import { TopPagesTable } from '@/components/admin/statistics/TopPagesTable';

export default function Statistics() {
  const [days, setDays] = useState(7);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">📊 Statistieken Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Gedetailleerde analytics met admin views uitgesloten
              </p>
            </div>
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Laatste 7 dagen</SelectItem>
                <SelectItem value="14">Laatste 14 dagen</SelectItem>
                <SelectItem value="30">Laatste 30 dagen</SelectItem>
                <SelectItem value="90">Laatste 90 dagen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TrafficOverview days={days} />

          <Tabs defaultValue="sources" className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full max-w-3xl">
              <TabsTrigger value="sources">Bronnen</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="time">Tijd</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="growth">Groei</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <TrafficSourcesChart days={days} />
                <TopPagesTable days={days} filterSource="facebook" title="Top Pagina's via Facebook" />
              </div>
              <TopPagesTable days={days} title="Alle Top Pagina's" />
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <ContentPerformance days={days} />
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <DeviceBreakdownChart days={days} />
            </TabsContent>

            <TabsContent value="time" className="space-y-4">
              <TimeAnalysis days={days} />
            </TabsContent>

            <TabsContent value="facebook" className="space-y-4">
              <FacebookPerformance />
            </TabsContent>

            <TabsContent value="growth" className="space-y-4">
              <GrowthMetrics />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
