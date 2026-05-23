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
    title: "Scans",
    icon: Disc,
    items: [
      { title: "Recente Scans", url: "/admin/recent-scans", icon: Disc },
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
    title: "Marketing",
    icon: Bell,
    items: [
      { title: "Popup Beheer", url: "/admin/popups", icon: Bell },
    ]
  },
  {
    title: "Discogs",
    icon: MessageSquare,
    items: [
      { title: "Discogs Bulk Berichten", url: "/admin/discogs-messages", icon: MessageSquare },
      { title: "Discogs Email Box", url: "/admin/discogs-bulk-email", icon: Mail },
    ]
  },
];


export function AdminSidebar() {
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
    <div className="flex flex-col h-full">
      {/* Search & Branding */}
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
        <div className="relative">
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredMenuItems.map((section) => {
          const groupActive = isGroupActive(section.items);
          const defaultOpen = section.defaultOpen !== false;
          const SectionIcon = section.icon;
          
          return (
            <Collapsible
              key={section.title}
              defaultOpen={defaultOpen || groupActive}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center w-full gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors rounded-md">
                  <SectionIcon className="h-3 w-3 shrink-0" />
                  <span className="flex-1 text-left">{section.title}</span>
                  <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-90 [[data-state=open]>&]:rotate-90" />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.url, item.end);
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </div>
  );
}
