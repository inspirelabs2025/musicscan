
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Menu, X, Images, Brain, LogOut, User, Music, Store, Newspaper, ScanLine, ChevronDown, Library, LogIn, BarChart3, MessageCircle, LayoutDashboard, Trophy, Users, DollarSign, Archive, Clock, Heart, Package, Headphones, Calendar, BookOpen, Sparkles, CircleDot, Youtube, Globe, Flag, Building2 } from "lucide-react";
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
import { ShoppingCartWidget } from "@/components/ShoppingCartWidget";

// SHOP MENU ITEMS
const shopMenuItems = [
  { title: "Shop Overzicht", url: "/shop", icon: ShoppingCart, highlight: true },
  { title: "Art Prints", url: "/art-shop", icon: Images },
  { title: "Metal Prints", url: "/metaalprints", icon: Images },
  { title: "Posters", url: "/posters", icon: Images },
  { title: "Canvas Doeken", url: "/canvas", icon: Images },
  { title: "T-shirts", url: "/tshirts", icon: Package },
  { title: "Sokken", url: "/socks", icon: Package },
  { title: "Buttons & Badges", url: "/buttons", icon: CircleDot },
  { title: "Alle Winkels", url: "/shops", icon: Store },
  { title: "Marktplaats", url: "/marketplace", icon: ShoppingCart },
  { title: "Catalogus", url: "/catalog", icon: Library },
  { title: "Mijn Winkel", url: "/my-shop", icon: Store, requiresAuth: true }
];

// VERHALEN MENU ITEMS
const verhalenMenuItems = [
  { title: "Plaat Verhalen", url: "/verhalen", icon: Music },
  { title: "Album Reviews", url: "/reviews", icon: BookOpen },
  { title: "Artiest Spotlights", url: "/artist-spotlights", icon: Sparkles },
  { title: "Singles", url: "/singles", icon: Music },
  { title: "Artiesten", url: "/artists", icon: Users },
  { title: "Opnamestudio's", url: "/studio-stories", icon: Building2 },
  { title: "Anekdotes", url: "/anekdotes", icon: BookOpen },
  { title: "FanWall", url: "/fanwall", icon: Images },
  { title: "YouTube Ontdekkingen", url: "/youtube-discoveries", icon: Youtube },
  { title: "Nieuws", url: "/nieuws", icon: Newspaper },
  { title: "Nieuwe Releases", url: "/releases", icon: Music },
  { title: "Podcasts", url: "/podcasts", icon: Headphones },
  { title: "Time Machine", url: "/time-machine", icon: Clock },
  { title: "Vandaag in de Muziekgeschiedenis", url: "/vandaag-in-de-muziekgeschiedenis", icon: Calendar }
];

// LANDEN & GENRES MENU ITEMS
const landenGenresMenuItems = [
  { title: "🇳🇱 Nederland", url: "/nederland", icon: Flag, highlight: true },
  { title: "🇫🇷 Frankrijk", url: "/frankrijk", icon: Flag, highlight: true },
  { title: "🎧 Dance/House", url: "/dance-house", icon: Music, highlight: true },
  { title: "🎬 Filmmuziek", url: "/filmmuziek", icon: Music, highlight: true },
  { title: "🎄 Kerst", url: "/kerst", icon: Music, highlight: true },
  { title: "Alle Artiesten", url: "/artists", icon: Users },
  { title: "Alle Releases", url: "/releases", icon: Music },
  { title: "Muziekgeschiedenis", url: "/vandaag-in-de-muziekgeschiedenis", icon: Calendar },
];

// SCAN & COLLECTIE MENU ITEMS (Logged in only)
const scanCollectionMenuItems = [
  { title: "Scanner", url: "/scanner", icon: ScanLine },
  { title: "Smart Scan", url: "/ai-scan-v2", icon: Brain },
  { title: "Mijn Collectie", url: "/my-collection", icon: Music },
  { title: "Collectie Inzicht", url: "/collection-overview", icon: BarChart3 },
  { title: "Alle Scans", url: "/unified-scan-overview", icon: Archive }
];

// SLIMME TOOLS MENU ITEMS (Logged in only)
const aiToolsMenuItems = [
  { title: "Echo 🎵", url: "/echo", icon: Music },
  { title: "Chat met Collectie", url: "/collection-chat", icon: MessageCircle },
  { title: "Prijscheck", url: "/quick-price-check", icon: DollarSign },
  { title: "Muziek Analyse", url: "/ai-analysis", icon: Brain },
  { title: "Spotify Profiel", url: "/spotify-profile", icon: Music }
];

// COMMUNITY MENU ITEMS
const communityMenuItems = [
  { title: "FanWall", url: "/fanwall", icon: Images },
  { title: "Mijn Likes", url: "/my/liked", icon: Heart },
  { title: "Mijn Quizzen", url: "/mijn-quizzen", icon: Trophy },
  { title: "Forum", url: "/forum", icon: MessageCircle },
  { title: "Social", url: "/social", icon: Users },
  { title: "Prestaties", url: "/prestaties", icon: Trophy }
];

const getProfileMenuItem = (userId?: string) => {
  if (!userId) return null;
  return { title: "Mijn Profiel", url: `/profile/${userId}`, icon: User };
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

  const profileMenuItem = getProfileMenuItem(user?.id);
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
          
          <NavigationMenu className="flex-1">
          <NavigationMenuList className="gap-1">
            {/* Home */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <NavLink item={{ title: "Home", url: "/", icon: Home }} />
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Quizzen */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <NavLink item={{ title: "Quizzen", url: "/quizzen", icon: Trophy }} />
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
                    Scan & Collectie
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
                    Slimme Tools
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

                {/* Community Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isCommunityPageActive && "bg-accent text-accent-foreground"
                  )}>
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[250px] gap-1 p-4 bg-popover">
                      {communityMenuItems.map((item) => (
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
                      {profileMenuItem && (
                        <>
                          <div className="border-t my-2" />
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
                        </>
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
                          Uitloggen
                        </Button>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Dashboard Link */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink item={{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }} />
                  </NavigationMenuLink>
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
                    <NavLink item={{ title: "Prijscheck", url: "/quick-price-check", icon: DollarSign }} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <NavLink item={{ title: "Forum", url: "/forum", icon: MessageCircle }} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/auth"
                      className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Inloggen
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Notifications Bell - Only show when logged in */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && <NotificationsDropdown />}
          
          {/* Shopping Cart Widget */}
          <ShoppingCartWidget />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between w-full">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-2 border-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile Search - REMOVED */}
              
               <nav className="flex flex-col flex-1 p-4 space-y-1 overflow-y-auto">
                 {/* Home */}
                 <NavLink item={{ title: "Home", url: "/", icon: Home }} mobile />

                 {/* Quizzen */}
                 <NavLink item={{ title: "Quizzen", url: "/quizzen", icon: Trophy }} mobile />

                
                  {user ? (
                   <>
                     {/* Scan & Collectie Section */}
                     <div className="mt-2">
                       <Button
                         variant="ghost"
                         onClick={() => setIsScanCollectionMenuOpen(!isScanCollectionMenuOpen)}
                         className={cn(
                           "w-full justify-start text-muted-foreground hover:text-primary",
                           isScanCollectionPageActive && "bg-muted text-primary"
                         )}
                       >
                         <ScanLine className="h-4 w-4 mr-3" />
                         <span className="text-base">Scan & Collectie</span>
                         <ChevronDown className={cn(
                           "h-4 w-4 ml-auto transition-transform",
                           isScanCollectionMenuOpen && "rotate-180"
                         )} />
                       </Button>
                       {isScanCollectionMenuOpen && (
                         <div className="ml-6 mt-1 space-y-1">
                           {scanCollectionMenuItems.map((item) => (
                             <NavLink key={item.title} item={item} mobile />
                           ))}
                         </div>
                       )}
                     </div>

                     {/* AI Tools Section */}
                     <div className="mt-2">
                       <Button
                         variant="ghost"
                         onClick={() => setIsAiToolsMenuOpen(!isAiToolsMenuOpen)}
                         className={cn(
                           "w-full justify-start text-muted-foreground hover:text-primary",
                           isAiToolsPageActive && "bg-muted text-primary"
                         )}
                       >
                         <Brain className="h-4 w-4 mr-3" />
                         <span className="text-base">AI Tools</span>
                         <ChevronDown className={cn(
                           "h-4 w-4 ml-auto transition-transform",
                           isAiToolsMenuOpen && "rotate-180"
                         )} />
                       </Button>
                       {isAiToolsMenuOpen && (
                         <div className="ml-6 mt-1 space-y-1">
                           {aiToolsMenuItems.map((item) => (
                             <NavLink key={item.title} item={item} mobile />
                           ))}
                         </div>
                       )}
                     </div>

                     {/* Community Section */}
                     <div className="mt-2">
                       <Button
                         variant="ghost"
                         onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
                         className={cn(
                           "w-full justify-start text-muted-foreground hover:text-primary",
                           isCommunityPageActive && "bg-muted text-primary"
                         )}
                       >
                         <Users className="h-4 w-4 mr-3" />
                         <span className="text-base">Community</span>
                         <ChevronDown className={cn(
                           "h-4 w-4 ml-auto transition-transform",
                           isCommunityMenuOpen && "rotate-180"
                         )} />
                       </Button>
                       {isCommunityMenuOpen && (
                         <div className="ml-6 mt-1 space-y-1">
                           {communityMenuItems.map((item) => (
                             <NavLink key={item.title} item={item} mobile />
                           ))}
                           {profileMenuItem && (
                             <>
                               <div className="border-t my-2" />
                               <NavLink item={profileMenuItem} mobile />
                             </>
                           )}
                         </div>
                       )}
                     </div>

                     {/* Dashboard */}
                     <NavLink item={{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }} mobile />
                     
                     {/* Mobile User Section */}
                     <div className="border-t mt-auto pt-4">
                       <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground mb-2">
                         <User className="h-4 w-4 flex-shrink-0" />
                         <span className="truncate">{user?.email}</span>
                       </div>
                       <Button 
                         variant="ghost" 
                         onClick={signOut}
                         className="w-full justify-start text-muted-foreground hover:text-primary"
                       >
                         <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                         <span>Uitloggen</span>
                       </Button>
                     </div>
                   </>
                 ) : (
                   <>
                     {/* Public users - direct links */}
                     <NavLink item={{ title: "Prijscheck", url: "/quick-price-check", icon: DollarSign }} mobile />
                     <NavLink item={{ title: "Forum", url: "/forum", icon: MessageCircle }} mobile />
                     
                     <div className="mt-auto pt-4">
                       <Button asChild className="w-full">
                         <Link to="/auth" onClick={() => setIsOpen(false)}>
                           <LogIn className="h-4 w-4 mr-2" />
                           Inloggen
                         </Link>
                       </Button>
                     </div>
                   </>
                 )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <Link to="/" className="flex-shrink-0">
          <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
        </Link>
        
        {/* Mobile Shopping Cart Widget */}
        <ShoppingCartWidget />
      </div>
      </div>
    </header>
  );
}
