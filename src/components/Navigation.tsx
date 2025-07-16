import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Archive, Menu, X, Images } from "lucide-react";
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

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Bulk Scan", url: "/bulkerimage", icon: Images },
  { title: "Marketplace", url: "/marketplace-overview", icon: ShoppingCart },
  { title: "Collection", url: "/collection-overview", icon: Archive }
];

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

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
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
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
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}