import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageviewStatsWidget } from "@/components/admin/PageviewStatsWidget";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Palette,
  Package,
  Wand2,
  Music,
  Database,
  Wrench,
  FileText,
  Settings,
  BarChart3,
  Globe,
  Disc,
  ShoppingBag,
  Brush,
  PenTool,
  AlertCircle,
  CheckCircle,
  Clock,
  TestTube,
  Newspaper,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Image
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdminPage {
  title: string;
  description: string;
  path: string;
  icon: any;
  category: string;
  status?: "ok" | "warning" | "error";
  badge?: string;
  testOnly?: boolean;
}

const adminPages: AdminPage[] = [
  // Monitoring & Analytics
  {
    title: "Status Dashboard",
    description: "Live overzicht van alle processen, queues en content generatie",
    path: "/admin/status",
    icon: BarChart3,
    category: "monitoring",
    status: "ok",
    badge: "Live"
  },
  {
    title: "SuperAdmin Dashboard",
    description: "Overzicht van alle systeem statistieken en gebruikersactiviteit",
    path: "/superadmin-dashboard",
    icon: LayoutDashboard,
    category: "monitoring",
    status: "ok"
  },
  {
    title: "Cronjob Monitor",
    description: "Real-time monitoring van cronjob uitvoering en queue status",
    path: "/admin/cronjob-monitor",
    icon: Clock,
    category: "monitoring",
    status: "ok",
    badge: "Live"
  },
  {
    title: "SEO Monitoring",
    description: "Bekijk SEO gezondheid, sitemaps en IndexNow status",
    path: "/admin/seo-monitoring",
    icon: Globe,
    category: "monitoring",
    status: "ok"
  },
  {
    title: "Price History Admin",
    description: "Beheer prijshistorie data en verzamel nieuwe prijzen",
    path: "/admin/price-history",
    icon: TrendingUp,
    category: "monitoring"
  },

  // Art & Product Management
  {
    title: "Platform Products",
    description: "Beheer art products op het platform",
    path: "/admin/platform-products",
    icon: Package,
    category: "products",
    status: "ok"
  },
  {
    title: "Shop Products",
    description: "Beheer shop producten en voorraad",
    path: "/admin/shop-products",
    icon: ShoppingBag,
    category: "products"
  },
  {
    title: "Art Generator",
    description: "Genereer kunst prints voor individuele albums",
    path: "/admin/art-generator",
    icon: Palette,
    category: "products"
  },
  {
    title: "Bulk Art Generator",
    description: "Bulk genereren van art products",
    path: "/admin/bulk-art-generator",
    icon: Wand2,
    category: "products"
  },
  {
    title: "Sketch Art Generator",
    description: "Genereer sketch varianten van album covers",
    path: "/admin/sketch-art-generator",
    icon: PenTool,
    category: "products"
  },
  {
    title: "Lyric Poster Generator",
    description: "AI songtekst posters met copyright safeguards",
    path: "/admin/lyric-poster-generator",
    icon: Music,
    category: "products",
    badge: "New"
  },
  {
    title: "Socks of Sound",
    description: "Sokken designs geïnspireerd op albumcovers",
    path: "/admin/sock-generator",
    icon: Brush,
    category: "products",
    badge: "New"
  },
  {
    title: "T-Shirts of Sound",
    description: "AI T-shirt designs met albumcover artwork",
    path: "/admin/tshirt-generator",
    icon: Palette,
    category: "products",
    badge: "New"
  },
  {
    title: "Time Machine Manager",
    description: "Beheer Time Machine concert posters en events",
    path: "/admin/time-machine",
    icon: Clock,
    category: "products",
    badge: "Events"
  },
  {
    title: "Photo Art Stylizer",
    description: "Transform foto's naar posters en canvas doeken met AI stijlen",
    path: "/admin/photo-stylizer",
    icon: Wand2,
    category: "products",
    badge: "Canvas"
  },
  {
    title: "Singles Importer",
    description: "Bulk import van singles met automatische story generatie",
    path: "/admin/singles-importer",
    icon: Music,
    category: "products",
    badge: "Batch"
  },

  // Discogs & Content
  {
    title: "Curated Artists",
    description: "Beheer gecureerde artiesten en Discogs queue",
    path: "/admin/curated-artists",
    icon: Music,
    category: "content",
    status: "ok"
  },
  {
    title: "Discogs Lookup",
    description: "Zoek en verifieer Discogs release informatie",
    path: "/admin/discogs-lookup",
    icon: Database,
    category: "content"
  },
  {
    title: "Photo Moderation",
    description: "Modereer en beheer ingediende foto's",
    path: "/admin/photo-moderation",
    icon: Image,
    category: "content"
  },

  // Maintenance & Utilities
  {
    title: "Sitemap Management",
    description: "Beheer en genereer sitemaps voor SEO",
    path: "/admin/sitemap-management",
    icon: FileText,
    category: "maintenance",
    status: "ok"
  },
  {
    title: "Fix Blog Slugs",
    description: "Corrigeer en optimaliseer blog post slugs",
    path: "/admin/fix-blog-slugs",
    icon: LinkIcon,
    category: "maintenance"
  },
  {
    title: "Fix Product Titles",
    description: "Normaliseer product titels",
    path: "/admin/fix-product-titles",
    icon: Settings,
    category: "maintenance"
  },
  {
    title: "Bulk Product Cleanup",
    description: "Bulk opschonen van product data",
    path: "/admin/bulk-product-cleanup",
    icon: Wrench,
    category: "maintenance"
  },
  {
    title: "Auto Cleanup Today",
    description: "Automatische cleanup van vandaag's data",
    path: "/admin/auto-cleanup-today",
    icon: RefreshCw,
    category: "maintenance"
  },
  {
    title: "Backfill Artist FanWalls",
    description: "Maak artist fanwall records aan voor bestaande foto's",
    path: "/admin/backfill-artist-fanwalls",
    icon: RefreshCw,
    category: "maintenance",
    badge: "Bulk"
  },
  {
    title: "Create Artist FanWall",
    description: "Maak handmatig een nieuwe artiest FanWall aan met foto's",
    path: "/admin/create-artist-fanwall",
    icon: Users,
    category: "maintenance",
    badge: "New"
  },
  {
    title: "Generate Seed",
    description: "Genereer seed data voor testing en development",
    path: "/admin/generate-seed",
    icon: Settings,
    category: "maintenance"
  },
  {
    title: "Bulk Poster Upload",
    description: "Bulk upload posters en album covers",
    path: "/admin/bulk-poster-upload",
    icon: Image,
    category: "maintenance"
  },

  // Test Pages
  {
    title: "Test Music News",
    description: "Test music news generatie",
    path: "/admin/test/music-news",
    icon: Newspaper,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test News Update",
    description: "Test news update functionaliteit",
    path: "/admin/test/news-update",
    icon: RefreshCw,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test News Generation",
    description: "Test news generatie proces",
    path: "/admin/test/news-generation",
    icon: Newspaper,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test Blog Regeneration",
    description: "Test blog regeneratie proces",
    path: "/admin/test/blog-regeneration",
    icon: FileText,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test Discogs Flow",
    description: "Test Discogs integratie workflow",
    path: "/admin/test/discogs-flow",
    icon: Disc,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test Discogs Blog Gen",
    description: "Test Discogs blog generatie",
    path: "/admin/test/discogs-blog-generation",
    icon: FileText,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test Discogs ID Finder",
    description: "Test Discogs ID finder functionaliteit",
    path: "/admin/test/discogs-id",
    icon: Database,
    category: "testing",
    testOnly: true
  },
  {
    title: "Test Album Cover Backfill",
    description: "Test album cover backfill proces",
    path: "/admin/test/album-cover-backfill",
    icon: Image,
    category: "testing",
    testOnly: true
  },
  {
    title: "Base64 Image Cleanup",
    description: "Verwijder base64 afbeeldingen uit platform_products (herstelt /kerst)",
    path: "/admin/test/base64-image-cleanup",
    icon: Image,
    category: "testing",
    testOnly: true
  },
];

const categories = [
  { id: "monitoring", title: "📊 Monitoring & Analytics", icon: BarChart3 },
  { id: "products", title: "🎨 Art & Product Management", icon: Package },
  { id: "content", title: "🎵 Discogs & Content", icon: Music },
  { id: "maintenance", title: "🛠️ Maintenance & Utilities", icon: Wrench },
  { id: "testing", title: "🧪 Development & Testing", icon: TestTube },
];

export default function MainAdmin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPages = adminPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Centraal overzicht van alle admin tools en functionaliteiten
          </p>
        </div>

        {/* Pageview Stats Widget */}
        <div className="mb-8 max-w-md">
          <PageviewStatsWidget />
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Zoek admin tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryPages = filteredPages.filter(
              (page) => page.category === category.id
            );

            if (categoryPages.length === 0) return null;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPages.map((page) => (
                    <Card
                      key={page.path}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(page.path)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <page.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {page.title}
                              </CardTitle>
                            </div>
                          </div>
                          {page.status && getStatusIcon(page.status)}
                        </div>
                        <CardDescription className="mt-2">
                          {page.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {page.badge && (
                            <Badge variant="secondary">{page.badge}</Badge>
                          )}
                          {page.testOnly && (
                            <Badge variant="outline" className="text-xs">
                              Test Only
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {category.id !== "testing" && <Separator className="mt-8" />}
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredPages.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen resultaten gevonden</h3>
            <p className="text-muted-foreground">
              Probeer een andere zoekterm
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
