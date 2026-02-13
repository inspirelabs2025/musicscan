import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cpu, DollarSign, Zap, Clock, Image, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type PeriodOption = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  "7d": "Laatste 7 dagen",
  "30d": "Laatste 30 dagen",
  "90d": "Laatste 90 dagen",
};

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#6366f1", "#f97316"];

export default function AiCostMonitor() {
  const [period, setPeriod] = useState<PeriodOption>("30d");

  const daysMap: Record<PeriodOption, number> = { "7d": 7, "30d": 30, "90d": 90 };

  const { data: stats, isLoading } = useQuery({
    queryKey: ["ai-usage-stats", period],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysMap[period]);
      
      const { data, error } = await supabase.rpc("get_ai_usage_stats", {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
      });
      
      if (error) throw error;
      return data as {
        total_calls: number;
        total_tokens: number;
        total_cost_usd: number;
        calls_with_images: number;
        avg_duration_ms: number;
        by_function: Array<{ function_name: string; call_count: number; tokens: number; cost_usd: number; avg_ms: number }> | null;
        by_model: Array<{ model: string; call_count: number; tokens: number; cost_usd: number }> | null;
        daily_breakdown: Array<{ date: string; calls: number; tokens: number; cost_usd: number }> | null;
      };
    },
    refetchInterval: 60000,
  });

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Kostenmonitor</h1>
            <p className="text-muted-foreground">Lovable AI Gateway verbruik en kosten</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3.5 w-3.5" /> Totaal Calls
              </div>
              <p className="text-2xl font-bold">{stats?.total_calls ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Totaal Kosten
              </div>
              <p className="text-2xl font-bold">{formatCost(stats?.total_cost_usd ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Cpu className="h-3.5 w-3.5" /> Totaal Tokens
              </div>
              <p className="text-2xl font-bold">{formatTokens(stats?.total_tokens ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Image className="h-3.5 w-3.5" /> Met Afbeeldingen
              </div>
              <p className="text-2xl font-bold">{stats?.calls_with_images ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Gem. Duur
              </div>
              <p className="text-2xl font-bold">{stats?.avg_duration_ms ? `${(stats.avg_duration_ms / 1000).toFixed(1)}s` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Kosten/Call
              </div>
              <p className="text-2xl font-bold">
                {stats?.total_calls ? formatCost(stats.total_cost_usd / stats.total_calls) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dagelijks Verbruik</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.daily_breakdown && stats.daily_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...stats.daily_breakdown].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      labelFormatter={(v) => new Date(v).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                      formatter={(value: number, name: string) => {
                        if (name === 'calls') return [value, 'Calls'];
                        if (name === 'cost_usd') return [formatCost(value), 'Kosten'];
                        return [formatTokens(value), 'Tokens'];
                      }}
                    />
                    <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Laden..." : "Nog geen data beschikbaar"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Model Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verdeling per Model</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.by_model && stats.by_model.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.by_model}
                        dataKey="call_count"
                        nameKey="model"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.by_model.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {stats.by_model.map((m, i) => (
                      <div key={m.model} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-mono text-xs">{m.model.split('/')[1]}</span>
                        <Badge variant="secondary" className="text-xs">{m.call_count}x</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Laden..." : "Nog geen data beschikbaar"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Function Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kosten per Functie</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.by_function && stats.by_function.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Functie</th>
                      <th className="text-right py-2 font-medium">Calls</th>
                      <th className="text-right py-2 font-medium">Tokens</th>
                      <th className="text-right py-2 font-medium">Kosten</th>
                      <th className="text-right py-2 font-medium">Gem. Duur</th>
                      <th className="text-right py-2 font-medium">% Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.by_function.map((fn) => (
                      <tr key={fn.function_name} className="border-b border-muted/50 hover:bg-muted/30">
                        <td className="py-2 font-mono text-xs">{fn.function_name}</td>
                        <td className="text-right py-2">{fn.call_count}</td>
                        <td className="text-right py-2">{formatTokens(fn.tokens)}</td>
                        <td className="text-right py-2 font-medium">{formatCost(fn.cost_usd)}</td>
                        <td className="text-right py-2">{fn.avg_ms ? `${(fn.avg_ms / 1000).toFixed(1)}s` : "—"}</td>
                        <td className="text-right py-2">
                          <Badge variant="outline" className="text-xs">
                            {stats.total_cost_usd > 0 ? `${((fn.cost_usd / stats.total_cost_usd) * 100).toFixed(1)}%` : "0%"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {isLoading ? "Laden..." : "Nog geen AI calls gelogd. Integreer de logger in edge functions om data te verzamelen."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 Integratie Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Voeg logging toe aan edge functions met de shared helper:</p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
{`import { logAiUsage } from '../_shared/ai-usage-logger.ts';

const startTime = Date.now();
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', { ... });
const data = await response.json();

await logAiUsage({
  function_name: 'mijn-functie',
  model: 'google/gemini-2.5-flash',
  input_tokens: data.usage?.prompt_tokens,
  output_tokens: data.usage?.completion_tokens,
  total_tokens: data.usage?.total_tokens,
  has_images: true,
  image_count: 2,
  duration_ms: Date.now() - startTime,
});`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
