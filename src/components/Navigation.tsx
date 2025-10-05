
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Archive, Menu, X, Images, Brain, Database, LogOut, User, Music, Store, Newspaper, ScanLine, ChevronDown, Library, LogIn, BarChart3, MessageCircle, LayoutDashboard, Trophy, Users, DollarSign } from "lucide-react";
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

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Sociaal", url: "/social", icon: Users },
  { title: "Forum", url: "/forum", icon: MessageCircle },
  { title: "Prijscheck", url: "/quick-price-check", icon: DollarSign },
  { title: "Muzieknieuws", url: "/news", icon: Newspaper },
  { title: "Mijn Winkel", url: "/my-shop", icon: Store }
];

// Public navigation items for non-logged-in users
const publicNavigationItems = [
  { title: "Forum", url: "/forum", icon: MessageCircle },
  { title: "Prijscheck", url: "/quick-price-check", icon: DollarSign },
  { title: "Muzieknieuws", url: "/news", icon: Newspaper },
  { title: "Catalogus", url: "/catalog", icon: Library },
  { title: "Marktplaats", url: "/marketplace", icon: ShoppingCart },
  { title: "Winkels", url: "/shops", icon: Store },
];

const scanMenuItems = [
  { title: "Scanner", url: "/scanner", icon: Home },
  { title: "AI-Scan", url: "/ai-scan-v2", icon: Brain },
  { title: "AI-Scan Overview", url: "/ai-scan-overview", icon: Database },
  { title: "Alle Gescande Items", url: "/unified-scan-overview", icon: Archive }
];

const collectionMenuItems = [
  { title: "Mijn Collectie", url: "/my-collection", icon: Music },
  { title: "Collectie Inzicht", url: "/collection-overview", icon: BarChart3 },
  { title: "Spotify Profiel", url: "/spotify-profile", icon: Music },
  { title: "Prestaties", url: "/prestaties", icon: Trophy },
  { title: "Quiz", url: "/quiz", icon: Trophy },
  { title: "Muziek Analyse", url: "/ai-analysis", icon: Brain },
  { title: "Chat met je Muziek", url: "/collection-chat", icon: MessageCircle }
];

const getProfileMenuItems = (userId?: string) => {
  if (!userId) return [];
  return [
    { title: "Mijn Profiel", url: `/profile/${userId}`, icon: User }
  ];
};

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const profileMenuItems = getProfileMenuItems(user?.id);
  const isCollectionPageActive = collectionMenuItems.some(item => currentPath === item.url);
  const isProfilePageActive = profileMenuItems.some(item => currentPath === item.url);

  const NavLink = React.forwardRef<HTMLAnchorElement, { item: typeof navigationItems[0], mobile?: boolean }>(
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
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/">
          <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
        </Link>
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            {/* Regular Navigation Items */}
            {user ? (
              navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <NavLink item={item} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))
            ) : (
              publicNavigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <NavLink item={item} />
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))
            )}
            
            {user && (
              <>
                {/* Collection Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isCollectionPageActive && "bg-accent text-accent-foreground"
                  )}>
                    <Archive className="h-4 w-4 mr-2" />
                    Collection
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[300px] gap-1 p-4">
                      {collectionMenuItems.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <Link
                            to={item.url}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                              currentPath === item.url && "bg-accent text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{item.title}</div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>


                {/* Subscription Status */}
                <NavigationMenuItem>
                  <div className="px-2">
                    <SubscriptionStatus compact />
                  </div>
                </NavigationMenuItem>

                {/* Profiel Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isProfilePageActive && "bg-accent text-accent-foreground"
                  )}>
                    <User className="h-4 w-4 mr-2" />
                    Profiel
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[250px] gap-1 p-4">
                      {/* Profile Menu Items */}
                      {profileMenuItems.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <Link
                            to={item.url}
                            className={cn(
                              "flex items-center gap-2 rounded-md p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                              currentPath === item.url && "bg-accent text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{item.title}</div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                      {/* User Info and Logout */}
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border-t mt-2 pt-2">
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
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </>
            )}
            
            {!user && (
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
            )}
          </NavigationMenuList>
        </NavigationMenu>
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
               <nav className="flex flex-col flex-1 p-4 space-y-1 overflow-y-auto">
                 {/* Regular Navigation Items */}
                 {user ? (
                   navigationItems.map((item) => (
                     <NavLink key={item.title} item={item} mobile />
                   ))
                 ) : (
                   publicNavigationItems.map((item) => (
                     <NavLink key={item.title} item={item} mobile />
                   ))
                 )}
                
                  {user && (
                    <>
                      {/* Collection Section */}
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setIsCollectionMenuOpen(!isCollectionMenuOpen)}
                          className={cn(
                            "w-full justify-start text-muted-foreground hover:text-primary",
                            isCollectionPageActive && "bg-muted text-primary"
                          )}
                        >
                          <Archive className="h-4 w-4 mr-3" />
                          <span className="text-base">Collection</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 ml-auto transition-transform",
                            isCollectionMenuOpen && "rotate-180"
                          )} />
                        </Button>
                        {isCollectionMenuOpen && (
                          <div className="ml-6 mt-1 space-y-1">
                            {collectionMenuItems.map((item) => (
                              <NavLink key={item.title} item={item} mobile />
                            ))}
                          </div>
                        )}
                      </div>

                      
                      {/* Profiel Section */}
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          className={cn(
                            "w-full justify-start text-muted-foreground hover:text-primary",
                            isProfilePageActive && "bg-muted text-primary"
                          )}
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span className="text-base">Profiel</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 ml-auto transition-transform",
                            isProfileMenuOpen && "rotate-180"
                          )} />
                        </Button>
                         {isProfileMenuOpen && (
                          <div className="ml-6 mt-1 space-y-1">
                            {profileMenuItems.map((item) => (
                              <NavLink key={item.title} item={item} mobile />
                            ))}
                          </div>
                        )}
                      </div>
                     
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
                 )}
                 
                 {!user && (
                   <div className="mt-auto pt-4">
                     <Button asChild className="w-full">
                       <Link to="/auth" onClick={() => setIsOpen(false)}>
                         <LogIn className="h-4 w-4 mr-2" />
                         Inloggen
                       </Link>
                     </Button>
                   </div>
                 )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <Link to="/">
          <img src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" alt="MusicScan" className="h-[58px] cursor-pointer" />
        </Link>
      </div>
    </>
  );
}
