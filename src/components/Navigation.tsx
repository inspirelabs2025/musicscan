import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Archive } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Marketplace", url: "/marketplace-overview", icon: ShoppingCart },
  { title: "Collection", url: "/collection-overview", icon: Archive }
];

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-1">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.url;
          const Icon = item.icon;
          
          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink asChild>
                <Link
                  to={item.url}
                  className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}