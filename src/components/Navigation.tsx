
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Menu, X, Images, Brain, LogOut, User, Music, Store, Newspaper, ScanLine, ChevronDown, Library, LogIn, BarChart3, MessageCircle, LayoutDashboard, Trophy, Users, DollarSign, Archive, Clock, Heart, Package, Headphones, Calendar, BookOpen, Sparkles, CircleDot, Youtube, Globe, Flag, Building2, Disc3, RefreshCw } from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShoppingCartWidget } from "@/components/ShoppingCartWidget";
import { useLanguage } from "@/contexts/LanguageContext";

const getProfileMenuItem = (userId?: string, label?: string) => {
  if (!userId) return null;
  return { title: label || "Mijn Profiel", url: `/profile/${userId}`, icon: User };
};

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isVerhalenMenuOpen, setIsVerhalenMenuOpen] = useState(false);
  const [isLandenGenresMenuOpen, setIsLandenGenresMenuOpen] = useState(false);
  const [isScanCollectionMenuOpen, setIsScanCollectionMenuOpen] = useState(false);
  const [isAiToolsMenuOpen, setIsAiToolsMenuOpen] = useState(false);
  const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  // Menu items using translations
  const shopMenuItems = [
    { title: t('nav.shopOverview'), url: "/shop", icon: ShoppingCart, highlight: true },
    { title: t('nav.artPrints'), url: "/art-shop", icon: Images },
    { title: t('nav.metalPrints'), url: "/metaalprints", icon: Images },
    { title: t('nav.posters'), url: "/posters", icon: Images },
    { title: t('nav.canvasArt'), url: "/canvas", icon: Images },
    { title: t('nav.tshirts'), url: "/tshirts", icon: Package },
    { title: t('nav.socks'), url: "/socks", icon: Package },
    { title: t('nav.buttonsBadges'), url: "/buttons", icon: CircleDot },
    { title: t('nav.allShops'), url: "/shops", icon: Store },
    { title: t('nav.marketplace'), url: "/marketplace", icon: ShoppingCart },
    { title: t('nav.catalog'), url: "/catalog", icon: Library },
    { title: t('nav.myShop'), url: "/my-shop", icon: Store, requiresAuth: true }
  ];

  const verhalenMenuItems = [
    { title: t('nav.albumStories'), url: "/verhalen", icon: Music },
    { title: t('nav.albumReviews'), url: "/reviews", icon: BookOpen },
    { title: t('nav.artistSpotlights'), url: "/artist-spotlights", icon: Sparkles },
    { title: t('nav.singles'), url: "/singles", icon: Music },
    { title: t('nav.artists'), url: "/artists", icon: Users },
    { title: t('nav.studios'), url: "/studio-stories", icon: Building2 },
    { title: t('nav.anecdotes'), url: "/anekdotes", icon: BookOpen },
    { title: t('nav.fanwall'), url: "/fanwall", icon: Images },
    { title: t('nav.youtubeDiscoveries'), url: "/youtube-discoveries", icon: Youtube },
    { title: t('nav.news'), url: "/nieuws", icon: Newspaper },
    { title: t('nav.newReleases'), url: "/releases", icon: Music },
    { title: t('nav.podcasts'), url: "/podcasts", icon: Headphones },
    { title: t('nav.timeMachine'), url: "/time-machine", icon: Clock },
    { title: t('nav.musicHistory'), url: "/vandaag-in-de-muziekgeschiedenis", icon: Calendar }
  ];

  const landenGenresMenuItems = [
    { title: "🇳🇱 " + t('nav.netherlands'), url: "/nederland", icon: Flag, highlight: true },
    { title: "🇫🇷 " + t('nav.france'), url: "/frankrijk", icon: Flag, highlight: true },
    { title: "🎧 " + t('nav.danceHouse'), url: "/dance-house", icon: Music, highlight: true },
    { title: "🎬 " + t('nav.filmMusic'), url: "/filmmuziek", icon: Music, highlight: true },
    { title: "🎄 " + t('nav.christmas'), url: "/kerst", icon: Music, highlight: true },
    { title: t('nav.allArtists'), url: "/artists", icon: Users },
    { title: t('nav.allReleases'), url: "/releases", icon: Music },
    { title: t('nav.musicHistory'), url: "/vandaag-in-de-muziekgeschiedenis", icon: Calendar },
  ];

  const scanCollectionMenuItems = [
    { title: t('nav.smartScan'), url: "/ai-scan-v2", icon: Brain },
    { title: t('nav.myCollection'), url: "/my-collection", icon: Music },
    { title: t('nav.myDiscogs'), url: "/mijn-discogs", icon: Disc3 },
    { title: t('nav.collectionInsight'), url: "/collection-overview", icon: BarChart3 }
  ];

  const aiToolsMenuItems = [
    { title: t('nav.echo'), url: "/echo", icon: Music },
    { title: t('nav.chatCollection'), url: "/collection-chat", icon: MessageCircle },
    { title: t('nav.priceCheck'), url: "/ai-scan-v2", icon: DollarSign },
    { title: t('nav.musicAnalysis'), url: "/ai-analysis", icon: Brain },
    { title: t('nav.spotifyProfile'), url: "/spotify-profile", icon: Music }
  ];

  const communityMenuItems = [
    { title: t('nav.fanwall'), url: "/fanwall", icon: Images },
    { title: t('nav.myLikes'), url: "/my/liked", icon: Heart },
    { title: t('nav.myQuizzes'), url: "/mijn-quizzen", icon: Trophy },
    { title: t('nav.forum'), url: "/forum", icon: MessageCircle },
    { title: t('nav.social'), url: "/social", icon: Users },
    { title: t('nav.achievements'), url: "/prestaties", icon: Trophy }
  ];

  const profileMenuItem = getProfileMenuItem(user?.id, t('nav.myProfile'));
  const isShopPageActive = shopMenuItems.some(item => currentPath === item.url);
  const isVerhalenPageActive = verhalenMenuItems.some(item => currentPath === item.url);
  const isLandenGenresPageActive = landenGenresMenuItems.some(item => currentPath === item.url) || currentPath === '/nederland' || currentPath === '/frankrijk';
  const isScanCollectionPageActive = scanCollectionMenuItems.some(item => currentPath === item.url);
  const isAiToolsPageActive = aiToolsMenuItems.some(item => currentPath === item.url);
  const isCommunityPageActive = communityMenuItems.some(item => currentPath === item.url) || (profileMenuItem && currentPath === profileMenuItem.url);

  const NavLink = React.forwardRef<HTMLAnchorElement, { item: { title: string; url: string; icon: any }, mobile?: boolean }>(
    ({ item, mobile = false }, ref) => {
      const isActive = currentPath === item.url;
      const Icon = item.icon;
      
      return (
        <Link
          ref={ref}
          to={item.url}
          onClick={() => mobile && setIsOpen(false)}
          className={cn(
            mobile 
              ? "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary" 
              : "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
            isActive && (mobile 
              ? "bg-muted text-primary" 
              : "bg-accent text-accent-foreground")
          )}
        >
          <Icon className={cn("h-4 w-4", mobile ? "" : "mr-2")} />
          {mobile && <span className="text-base">{item.title}</span>}
          {!mobile && item.title}
        </Link>
      );
    }
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 w-full">
          <Link to="/" className="flex-shrink-0">
            <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary animate-pulse"
            title="Hard Refresh"
            onClick={async () => {
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
              }
              sessionStorage.removeItem('musicscan_last_reload_version');
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <NavigationMenu className="flex-1">
          <NavigationMenuList className="gap-1">
            {/* Home */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <NavLink item={{ title: t('nav.home'), url: "/", icon: Home }} />
              </NavigationMenuLink>
            </NavigationMenuItem>

            {user && (
              <>
                {/* Scan & Collectie Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isScanCollectionPageActive && "bg-accent text-accent-foreground"
                  )}>
                    <ScanLine className="h-4 w-4 mr-2" />
                    {t('nav.scanCollection')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[300px] gap-1 p-4 bg-popover">
                      {scanCollectionMenuItems.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <Link
                            to={item.url}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                              currentPath === item.url && "bg-accent text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <div className="font-medium">{item.title}</div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Slimme Tools Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isAiToolsPageActive && "bg-accent text-accent-foreground"
                  )}>
                    <Brain className="h-4 w-4 mr-2" />
                    {t('nav.smartTools')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[300px] gap-1 p-4 bg-popover">
                      {aiToolsMenuItems.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <Link
                            to={item.url}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                              currentPath === item.url && "bg-accent text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <div className="font-medium">{item.title}</div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* User menu with logout */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    <User className="h-4 w-4 mr-2" />
                    {t('nav.account')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[250px] gap-1 p-4 bg-popover">
                      {profileMenuItem && (
                        <NavigationMenuLink asChild>
                          <Link
                            to={profileMenuItem.url}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                              currentPath === profileMenuItem.url && "bg-accent text-accent-foreground"
                            )}
                          >
                            <profileMenuItem.icon className="h-4 w-4" />
                            <div className="font-medium">{profileMenuItem.title}</div>
                          </Link>
                        </NavigationMenuLink>
                      )}
                      <div className="border-t mt-2 pt-2">
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {user?.email}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={signOut}
                          className="w-full justify-start text-muted-foreground hover:text-primary"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {t('nav.logout')}
                        </Button>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>


                {/* Subscription Status */}
                <NavigationMenuItem>
                  <div className="px-2">
                    <SubscriptionStatus compact />
                  </div>
                </NavigationMenuItem>
              </>
            )}
            
            {!user && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink item={{ title: t('nav.priceCheck'), url: "/quick-price-check", icon: DollarSign }} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink item={{ title: t('nav.forum'), url: "/forum", icon: MessageCircle }} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/auth"
                      className="group inline-flex h-auto w-max items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>{t('nav.register')}</span>
                        <span className="text-[10px] font-normal opacity-80">{t('nav.login')}</span>
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Desktop right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {user && <NotificationsDropdown />}
          <ShoppingCartWidget />
        </div>
      </div>

      {/* Mobile: only show logo centered, no hamburger menu */}
      <div className="md:hidden flex items-center justify-center w-full gap-2">
        <Link to="/" className="flex-shrink-0">
          <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary animate-pulse"
          title="Hard Refresh"
          onClick={async () => {
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map(n => caches.delete(n)));
            }
            sessionStorage.removeItem('musicscan_last_reload_version');
            window.location.reload();
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      </div>
    </header>
  );
}
