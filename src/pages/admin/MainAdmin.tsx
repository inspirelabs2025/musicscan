import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brush,
  ChevronRight,
  Clock,
  Database,
  Disc,
  FileText,
  Gift,
  Globe,
  Image,
  LayoutDashboard,
  Link as LinkIcon,
  Music,
  Newspaper,
  Package,
  Palette,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  TestTube,
  TrendingUp,
  Users,
  Wand2,
  Wrench,
  PenTool,
} from "lucide-react";

import { PageviewStatsWidget } from "@/components/admin/PageviewStatsWidget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminPage {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  category: "monitoring" | "products" | "content" | "maintenance" | "testing";
  status?: "ok" | "warning" | "error";
  badge?: string;
  testOnly?: boolean;
}

const adminPages: AdminPage[] = [
  {
    title: "Recente Scans",
    description: "Bekijk recente scans van gebruikers",
    path: "/admin/recent-scans",
    icon: Disc,
    category: "monitoring",
    status: "ok",
  },
  {
    title: "Manage Users",
    description: "Beheer gebruikers en rollen",
    path: "/admin/users",
    icon: Users,
    category: "monitoring",
  },
  {
    title: "Popup Beheer",
    description: "Beheer site popups en campagnes",
    path: "/admin/popups",
    icon: LayoutDashboard,
    category: "content",
  },
  {
    title: "Discogs Bulk Berichten",
    description: "Verstuur bulk berichten via Discogs",
    path: "/admin/discogs-messages",
    icon: Music,
    category: "content",
  },
  {
    title: "Discogs Email Box",
    description: "Discogs email inbox en bulk email beheer",
    path: "/admin/discogs-bulk-email",
    icon: Music,
    category: "content",
  },
];

const categories: Array<{
  id: AdminPage["category"];
  title: string;
  icon: LucideIcon;
}> = [
  { id: "monitoring", title: "Monitoring & Analytics", icon: BarChart3 },
  { id: "products", title: "Art & Product Management", icon: Package },
  { id: "content", title: "Discogs & Content", icon: Music },
  { id: "maintenance", title: "Maintenance & Utilities", icon: Wrench },
  { id: "testing", title: "Development & Testing", icon: TestTube },
];

const statusBadgeLabel: Record<NonNullable<AdminPage["status"]>, string> = {
  ok: "Actief",
  warning: "Check",
  error: "Issue",
};

export default function MainAdmin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return adminPages;

    return adminPages.filter(
      (page) =>
        page.title.toLowerCase().includes(q) ||
        page.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    const liveCount = adminPages.filter((page) => page.badge === "Live" || page.status === "ok").length;
    const testCount = adminPages.filter((page) => page.testOnly).length;
    return {
      total: adminPages.length,
      live: liveCount,
      automation: adminPages.filter((page) => page.category === "products" || page.category === "maintenance").length,
      testing: testCount,
    };
  }, []);

  return (
    <>
      <div className="min-h-[calc(100vh-3rem)] w-full space-y-6 bg-background px-4 py-5 md:px-8 md:py-8">
        <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">MusicScan beheer</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Admin overzicht</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
            Een rustige, leesbare cockpit voor monitoring en beheer. Gebruik de zoekbalk of spring direct naar een sectie.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="border-border/70">
              <CardHeader className="pb-1">
                <CardDescription>Totaal tools</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader className="pb-1">
                <CardDescription>Actieve tools</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{stats.live}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader className="pb-1">
                <CardDescription>Automatisering</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{stats.automation}</CardTitle>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader className="pb-1">
                <CardDescription>Test tools</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{stats.testing}</CardTitle>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Zoek admin tools..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 border-border/70 bg-background pl-10"
              />
            </div>

            {categories.map((category) => {
              const categoryPages = filteredPages.filter((page) => page.category === category.id);
              if (categoryPages.length === 0) return null;

              return (
                <Card key={category.id} className="border-border/70 shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base md:text-lg">{category.title}</CardTitle>
                      </div>
                      <Badge variant="secondary">{categoryPages.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryPages.map((page) => (
                      <button
                        key={page.path}
                        type="button"
                        onClick={() => navigate(page.path)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/35"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                            <page.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium md:text-[15px]">{page.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{page.description}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {page.badge && <Badge variant="outline">{page.badge}</Badge>}
                          {page.status && (
                            <Badge variant={page.status === "error" ? "destructive" : "secondary"}>
                              {statusBadgeLabel[page.status]}
                            </Badge>
                          )}
                          {page.testOnly && <Badge variant="outline">Test</Badge>}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {filteredPages.length === 0 && (
              <Card className="border-dashed border-border/70">
                <CardContent className="py-12 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Geen resultaten gevonden</p>
                  <p className="mt-1 text-sm text-muted-foreground">Probeer een andere zoekterm.</p>
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="space-y-4">
            <PageviewStatsWidget />
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Automatisering focus</CardTitle>
                <CardDescription>
                  Beheerpagina’s blijven zichtbaar, maar verwerking draait primair automatisch via cronjobs en pipelines.
                </CardDescription>
              </CardHeader>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
