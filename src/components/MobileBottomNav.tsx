import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, ShoppingCart, Trophy, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const currentPath = location.pathname;

  const items = [
    { icon: Home, label: t('nav.home'), url: "/" },
    { icon: ScanLine, label: "Scan", url: "/ai-scan-v2", requiresAuth: true },
    { icon: ShoppingCart, label: "Shop", url: "/shop" },
    { icon: Trophy, label: "Quiz", url: "/quizzen" },
    ...(user
      ? [{ icon: User, label: "Profiel", url: `/profile/${user.id}` }]
      : [{ icon: LogIn, label: t('nav.login'), url: "/auth" }]
    ),
  ];

  const filteredItems = items.filter(item => !('requiresAuth' in item && item.requiresAuth && !user));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-14">
        {filteredItems.map((item) => {
          const isActive = item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
                isActive && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
