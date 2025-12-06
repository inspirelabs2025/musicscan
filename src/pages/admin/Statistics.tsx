import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, differenceInDays, startOfDay, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { nl } from 'date-fns/locale';
import { TrafficOverview } from '@/components/admin/statistics/TrafficOverview';
import { TrafficSourcesChart } from '@/components/admin/statistics/TrafficSourcesChart';
import { ContentPerformance } from '@/components/admin/statistics/ContentPerformance';
import { DeviceBreakdownChart } from '@/components/admin/statistics/DeviceBreakdownChart';
import { TimeAnalysis } from '@/components/admin/statistics/TimeAnalysis';
import { FacebookPerformance } from '@/components/admin/statistics/FacebookPerformance';
import { GrowthMetrics } from '@/components/admin/statistics/GrowthMetrics';
import { TopPagesTable } from '@/components/admin/statistics/TopPagesTable';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | '7' | '14' | '30' | '90' | 'custom';

export default function Statistics() {
  const [period, setPeriod] = useState<TimePeriod>('7');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getDaysFromPeriod = (): number => {
    const today = startOfDay(new Date());
    switch (period) {
      case 'today': return 1;
      case 'yesterday': return 2;
      case 'week': return differenceInDays(today, startOfWeek(today, { locale: nl })) + 1;
      case 'month': return differenceInDays(today, startOfMonth(today)) + 1;
      case 'quarter': return 90;
      case 'year': return differenceInDays(today, startOfYear(today)) + 1;
      case 'custom': 
        if (customRange?.from && customRange?.to) {
          return differenceInDays(customRange.to, customRange.from) + 1;
        }
        return 7;
      default: return parseInt(period);
    }
  };

  const days = getDaysFromPeriod();

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'today': return 'Vandaag';
      case 'yesterday': return 'Gisteren';
      case 'week': return 'Deze week';
      case 'month': return 'Deze maand';
      case 'quarter': return 'Dit kwartaal';
      case 'year': return 'Dit jaar';
      case 'custom':
        if (customRange?.from && customRange?.to) {
          return `${format(customRange.from, 'd MMM', { locale: nl })} - ${format(customRange.to, 'd MMM', { locale: nl })}`;
        }
        return 'Aangepast';
      case '7': return 'Laatste 7 dagen';
      case '14': return 'Laatste 14 dagen';
      case '30': return 'Laatste 30 dagen';
      case '90': return 'Laatste 90 dagen';
      default: return `Laatste ${period} dagen`;
    }
  };

  const handleCustomSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setPeriod('custom');
      setIsCalendarOpen(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold">📊 Statistieken Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Gedetailleerde analytics met admin views uitgesloten
                </p>
              </div>
              {/* Quick period buttons - next to title */}
              <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
                {(['today', 'week', 'month', 'quarter'] as TimePeriod[]).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPeriod(p)}
                    className="text-xs"
                  >
                    {p === 'today' ? 'Vandaag' : p === 'week' ? 'Week' : p === 'month' ? 'Maand' : 'Kwartaal'}
                  </Button>
                ))}
              </div>
              
              {/* Dropdown for more options */}
              <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue>{getPeriodLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="yesterday">Gisteren</SelectItem>
                  <SelectItem value="week">Deze week</SelectItem>
                  <SelectItem value="month">Deze maand</SelectItem>
                  <SelectItem value="quarter">Dit kwartaal</SelectItem>
                  <SelectItem value="year">Dit jaar</SelectItem>
                  <SelectItem value="7">Laatste 7 dagen</SelectItem>
                  <SelectItem value="14">Laatste 14 dagen</SelectItem>
                  <SelectItem value="30">Laatste 30 dagen</SelectItem>
                  <SelectItem value="90">Laatste 90 dagen</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom date range picker */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={period === 'custom' ? 'secondary' : 'outline'}
                    size="sm"
                    className={cn('h-8 w-8', period === 'custom' && 'ring-2 ring-primary')}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={handleCustomSelect}
                    numberOfMonths={2}
                    locale={nl}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              <FacebookPerformance days={days} />
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
