import { 
  LayoutDashboard, 
  Package, 
  LayoutGrid,
  Wand2,
  Music,
  Globe,
  Wrench,
  TestTube,
  ChevronDown,
  Clock,
  ShoppingBag,
  ShoppingCart,
  Palette,
  Database,
  BarChart3,
  FileText,
  Settings,
  PenTool,
  Brush,
  Image,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Disc,
  Newspaper,
  Shield,
  BookOpen,
  MessageSquare,
  Mail,
  Sparkles,
  Facebook,
  Instagram,
  Server,
  CloudUpload,
  Bell,
  Mic,
  Send,
  Video,
  Cog,
  ListMusic,
  Crown
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "System Overview", url: "/admin/system-overview", icon: Server },
      { title: "SuperAdmin Stats", url: "/admin/dashboard", icon: BarChart3 },
      { title: "Cronjob Monitor", url: "/admin/cronjob-monitor", icon: Clock },
      { title: "Email & Notifications", url: "/admin/email-notifications", icon: Mail },
    ]
  },
  {
    title: "User Management",
    items: [
      { title: "Manage Users", url: "/admin/users", icon: Users },
    ]
  },
  {
    title: "Products & Shop",
    items: [
      { title: "All Products", url: "/admin/products", icon: LayoutGrid },
      { title: "Platform Products", url: "/admin/platform-products", icon: Package },
      { title: "Shop Products", url: "/admin/shop-products", icon: ShoppingBag },
      { title: "Shop Orders", url: "/admin/shop-orders", icon: ShoppingCart },
      { title: "Time Machine", url: "/admin/time-machine", icon: Clock },
    ]
  },
  {
    title: "Content Generators",
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
    title: "Content Management",
    items: [
      { title: "Master Artists", url: "/admin/master-artists", icon: Crown },
      { title: "Verhalen", url: "/admin/album-reviews", icon: BookOpen },
      { title: "Studio Stories", url: "/admin/studio-stories", icon: Mic },
      { title: "Eigen Podcasts", url: "/admin/own-podcasts", icon: Mic },
      { title: "RSS News Manager", url: "/admin/news-rss-manager", icon: Newspaper },
      { title: "Curated Artists (LP)", url: "/admin/curated-artists", icon: Music },
      { title: "Discogs Lookup", url: "/admin/discogs-lookup", icon: Database },
      { title: "Photo Moderation", url: "/admin/photo-moderation", icon: Image },
      { title: "Auto Comments", url: "/admin/auto-comments", icon: MessageSquare },
    ]
  },
  {
    title: "SEO & Analytics",
    items: [
      { title: "Statistieken", url: "/admin/statistics", icon: BarChart3 },
      { title: "SEO Monitoring", url: "/admin/seo-monitoring", icon: Globe },
      { title: "Sitemap Management", url: "/admin/sitemap-management", icon: FileText },
      { title: "Price History", url: "/admin/price-history", icon: BarChart3 },
    ]
  },
  {
    title: "Maintenance",
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
    items: [
      { title: "Popup Beheer", url: "/admin/popups", icon: Bell },
    ]
  },
  {
    title: "Integraties",
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

  const isActive = (path: string, end?: boolean) => {
    if (end) return currentPath === path;
    return currentPath.startsWith(path);
  };

  const isGroupActive = (items: Array<{ url: string }>) => {
    return items.some(item => currentPath.startsWith(item.url));
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Admin</h2>}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        {menuItems.map((section) => {
          const isExpanded = isGroupActive(section.items);
          const defaultOpen = section.defaultOpen !== false;
          
          return (
            <Collapsible
              key={section.title}
              defaultOpen={defaultOpen || isExpanded}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md">
                    {!collapsed && (
                      <>
                        <span>{section.title}</span>
                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </>
                    )}
                  </SidebarGroupLabel>
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
                                className="flex items-center gap-3"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
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
