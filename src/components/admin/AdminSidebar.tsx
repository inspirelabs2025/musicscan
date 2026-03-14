import { useState, useMemo } from 'react';
import { AdminCreditAlertBanner } from './AdminCreditAlertBanner';
import { 
  LayoutDashboard, Package, LayoutGrid, Wand2, Music, Globe,
  Wrench, ChevronRight, Clock, ShoppingBag, ShoppingCart, Palette,
  Database, BarChart3, FileText, Settings, PenTool, Brush, Image,
  RefreshCw, Link as LinkIcon, Users, Disc, Newspaper, BookOpen,
  MessageSquare, Mail, Sparkles, Facebook, Instagram, Server,
  CloudUpload, Bell, Mic, Send, Video, Cog, ListMusic, Crown,
  Bot, Cpu, Search
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

interface MenuSection {
  title: string;
  icon: typeof LayoutDashboard;
  defaultOpen?: boolean;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "System Overview", url: "/admin/system-overview", icon: Server },
      { title: "SuperAdmin Stats", url: "/admin/dashboard", icon: BarChart3 },
      { title: "Recente Scans", url: "/admin/recent-scans", icon: Disc },
      { title: "Cronjob Monitor", url: "/admin/cronjob-monitor", icon: Clock },
      { title: "Email & Notifications", url: "/admin/email-notifications", icon: Mail },
    ]
  },
  {
    title: "Users",
    icon: Users,
    items: [
      { title: "Manage Users", url: "/admin/users", icon: Users },
    ]
  },
  {
    title: "Products & Shop",
    icon: ShoppingBag,
    items: [
      { title: "All Products", url: "/admin/products", icon: LayoutGrid },
      { title: "Platform Products", url: "/admin/platform-products", icon: Package },
      { title: "Shop Products", url: "/admin/shop-products", icon: ShoppingBag },
      { title: "Shop Orders", url: "/admin/shop-orders", icon: ShoppingCart },
      { title: "Time Machine", url: "/admin/time-machine", icon: Clock },
    ]
  },
  {
    title: "Generators",
    icon: Wand2,
    items: [
      { title: "Media Library", url: "/admin/media-library", icon: CloudUpload },
      { title: "Art Generator", url: "/admin/art-generator", icon: Palette },
      { title: "Bulk Art Generator", url: "/admin/bulk-art-generator", icon: Wand2 },
      { title: "Sketch Art", url: "/admin/sketch-art-generator", icon: PenTool },
      { title: "Lyric Posters", url: "/admin/lyric-poster-generator", icon: Music },
      { title: "Socks Designer", url: "/admin/sock-generator", icon: Brush },
      { title: "T-Shirt Designer", url: "/admin/tshirt-generator", icon: Brush },
      { title: "Button Designer", url: "/admin/button-generator", icon: Disc },
      { title: "Photo Stylizer", url: "/admin/photo-stylizer", icon: Wand2 },
      { title: "Singles Importer", url: "/admin/singles-importer", icon: Music },
      { title: "Artist Stories", url: "/admin/artist-stories-generator", icon: Users },
      { title: "Artist Spotlights", url: "/admin/artist-spotlights", icon: Sparkles },
      { title: "Top 2000 Importer", url: "/admin/top2000-importer", icon: ListMusic },
    ]
  },
  {
    title: "Content",
    icon: BookOpen,
    items: [
      { title: "Master Artists", url: "/admin/master-artists", icon: Crown },
      { title: "Verhalen", url: "/admin/album-reviews", icon: BookOpen },
      { title: "Studio Stories", url: "/admin/studio-stories", icon: Mic },
      { title: "Eigen Podcasts", url: "/admin/own-podcasts", icon: Mic },
      { title: "RSS News Manager", url: "/admin/news-rss-manager", icon: Newspaper },
      { title: "Curated Artists (LP)", url: "/admin/curated-artists", icon: Music },
      { title: "Discogs Lookup", url: "/admin/discogs-lookup", icon: Database },
      { title: "Discogs Bulk Berichten", url: "/admin/discogs-messages", icon: MessageSquare },
      { title: "Photo Moderation", url: "/admin/photo-moderation", icon: Image },
      { title: "Auto Comments", url: "/admin/auto-comments", icon: MessageSquare },
      { title: "Magic Mike Profiel", url: "/admin/magic-mike", icon: Bot },
    ]
  },
  {
    title: "SEO & Analytics",
    icon: BarChart3,
    items: [
      { title: "Statistieken", url: "/admin/statistics", icon: BarChart3 },
      { title: "AI Kostenmonitor", url: "/admin/ai-costs", icon: Cpu },
      { title: "SEO Monitoring", url: "/admin/seo-monitoring", icon: Globe },
      { title: "Sitemap Management", url: "/admin/sitemap-management", icon: FileText },
      { title: "Price History", url: "/admin/price-history", icon: BarChart3 },
    ]
  },
  {
    title: "Maintenance",
    icon: Wrench,
    items: [
      { title: "Fix Blog Slugs", url: "/admin/fix-blog-slugs", icon: LinkIcon },
      { title: "Fix Product Titles", url: "/admin/fix-product-titles", icon: Settings },
      { title: "Bulk Cleanup", url: "/admin/bulk-cleanup", icon: Wrench },
      { title: "Auto Cleanup Today", url: "/admin/auto-cleanup-today", icon: RefreshCw },
      { title: "Backfill FanWalls", url: "/admin/backfill-artist-fanwalls", icon: RefreshCw },
      { title: "Create FanWall", url: "/admin/create-artist-fanwall", icon: Users },
      { title: "Generate Seed", url: "/admin/generate-seed", icon: Settings },
      { title: "Bulk Poster Upload", url: "/admin/bulk-poster-upload", icon: Image },
    ]
  },
  {
    title: "Marketing",
    icon: Bell,
    items: [
      { title: "Popup Beheer", url: "/admin/popups", icon: Bell },
    ]
  },
  {
    title: "Integraties",
    icon: Cog,
    items: [
      { title: "Render Queue", url: "/admin/render-queue", icon: Cog },
      { title: "TikTok Videos", url: "/admin/tiktok-videos", icon: Video },
      { title: "Metricool Social", url: "/admin/metricool", icon: Send },
      { title: "Facebook Admin", url: "/admin/facebook-admin", icon: Facebook },
      { title: "Facebook Sync", url: "/admin/facebook-sync", icon: Facebook },
      { title: "Instagram Admin", url: "/admin/instagram-admin", icon: Instagram },
    ]
  },
  {
    title: "Testing",
    icon: Disc,
    defaultOpen: false,
    items: [
      { title: "Music News", url: "/admin/test/music-news", icon: Newspaper },
      { title: "News Update", url: "/admin/test/news-update", icon: RefreshCw },
      { title: "Blog Regeneration", url: "/admin/test/blog-regeneration", icon: FileText },
      { title: "Discogs Flow", url: "/admin/test/discogs-flow", icon: Disc },
      { title: "Discogs Blog Gen", url: "/admin/test/discogs-blog-generation", icon: FileText },
      { title: "Discogs ID Finder", url: "/admin/test/discogs-id", icon: Database },
      { title: "Album Cover Backfill", url: "/admin/test/album-cover-backfill", icon: Image },
      { title: "Base64 Image Cleanup", url: "/admin/test/base64-image-cleanup", icon: Image },
      { title: "Anekdote Generatie", url: "/admin/test/anecdote-generation", icon: BookOpen },
    ]
  }
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string, end?: boolean) => {
    if (end) return currentPath === path;
    return currentPath.startsWith(path);
  };

  const isGroupActive = (items: Array<{ url: string }>) => {
    return items.some(item => currentPath.startsWith(item.url));
  };

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.title.toLowerCase().includes(q)
        )
      }))
      .filter(section => section.items.length > 0);
  }, [searchQuery]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      {/* Search & Branding */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2 space-y-3 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="text-primary-foreground text-xs font-bold">M</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight leading-tight">Admin Panel</span>
              <span className="text-[10px] text-muted-foreground leading-tight">MusicScan</span>
            </div>
          </div>
          <div className="relative admin-sidebar-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Zoek pagina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border/60 bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            />
          </div>
          <AdminCreditAlertBanner />
        </div>
      )}

      <SidebarContent className="px-1">
        {filteredMenuItems.map((section) => {
          const groupActive = isGroupActive(section.items);
          const defaultOpen = section.defaultOpen !== false;
          const SectionIcon = section.icon;
          
          return (
            <Collapsible
              key={section.title}
              defaultOpen={defaultOpen || groupActive}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0.5">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center w-full gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors rounded-md">
                    <SectionIcon className="h-3 w-3 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{section.title}</span>
                        <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const active = isActive(item.url, item.end);
                        return (
                          <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton asChild isActive={active}>
                              <Link
                                to={item.url}
                                data-active={active}
                                className="admin-sidebar-item flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px]"
                              >
                                <item.icon className="h-3.5 w-3.5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.title}</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
