
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Archive, Menu, X, Images, Brain, Database, LogOut, User } from "lucide-react";
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

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Release ID Scan", url: "/ai-scan-v2", icon: Brain },
  { title: "Release ID Overzicht", url: "/ai-scan-overview", icon: Database },
  { title: "Marketplace", url: "/marketplace-overview", icon: ShoppingCart },
  { title: "Collection", url: "/collection-overview", icon: Archive }
];

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

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
      <div className="hidden md:block">
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild>
                  <NavLink item={item} />
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {/* User Menu */}
            <NavigationMenuItem>
              <div className="flex items-center gap-2 ml-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {user?.email}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-muted-foreground hover:text-primary"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </Button>
              </div>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-2 border-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-48">
            <div className="flex flex-col space-y-4 mt-6">
              <div className="flex items-center justify-between mb-4">
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
              <nav className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <NavLink key={item.title} item={item} mobile />
                ))}
                
                {/* Mobile User Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={signOut}
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Uitloggen
                  </Button>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
