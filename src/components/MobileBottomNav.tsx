import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, ShoppingCart, Trophy, Menu, X, User, LogIn, LogOut, Music, Images, Brain, MessageCircle, DollarSign, BarChart3, Newspaper, Headphones, Clock, Calendar, BookOpen, Sparkles, CircleDot, Youtube, Globe, Flag, Building2, Store, Library, Package, Heart, Users, Archive, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileBottomNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: t('nav.home'), url: "/" },
    { icon: ScanLine, label: "Scan", url: "/ai-scan-v2", requiresAuth: true },
    { icon: Library, label: "Collectie", url: "/my-collection", requiresAuth: true },
    { icon: Trophy, label: "Quiz", url: "/quizzen" },
  ];

  const filteredNavItems = navItems.filter(item => !('requiresAuth' in item && item.requiresAuth && !user));

  const menuSections = [
    {
      title: t('nav.scanCollection'),
      items: [
        { icon: Brain, label: t('nav.smartScan'), url: "/ai-scan-v2" },
        { icon: Music, label: t('nav.myCollection'), url: "/my-collection" },
        { icon: Disc3, label: "Mijn Discogs", url: "/mijn-discogs" },
        { icon: BarChart3, label: t('nav.collectionInsight'), url: "/collection-overview" },
      ],
      requiresAuth: true,
    },
    {
      title: "Shop",
      items: [
        { icon: ShoppingCart, label: t('nav.shopOverview'), url: "/shop" },
        { icon: Images, label: t('nav.artPrints'), url: "/art-shop" },
        { icon: Images, label: t('nav.posters'), url: "/posters" },
        { icon: Images, label: t('nav.canvasArt'), url: "/canvas" },
        { icon: Package, label: t('nav.tshirts'), url: "/tshirts" },
        { icon: CircleDot, label: t('nav.buttonsBadges'), url: "/buttons" },
        { icon: Store, label: t('nav.marketplace'), url: "/marketplace" },
      ],
    },
    {
      title: t('nav.stories'),
      items: [
        { icon: Music, label: t('nav.albumStories'), url: "/verhalen" },
        { icon: BookOpen, label: t('nav.albumReviews'), url: "/reviews" },
        { icon: Sparkles, label: t('nav.artistSpotlights'), url: "/artist-spotlights" },
        { icon: Music, label: t('nav.singles'), url: "/singles" },
        { icon: Users, label: t('nav.artists'), url: "/artists" },
        { icon: Newspaper, label: t('nav.news'), url: "/nieuws" },
        { icon: Headphones, label: t('nav.podcasts'), url: "/podcasts" },
        { icon: Calendar, label: t('nav.musicHistory'), url: "/vandaag-in-de-muziekgeschiedenis" },
      ],
    },
    {
      title: t('nav.smartTools'),
      items: [
        { icon: Music, label: t('nav.echo'), url: "/echo" },
        { icon: MessageCircle, label: t('nav.chatCollection'), url: "/collection-chat" },
        { icon: DollarSign, label: t('nav.priceCheck'), url: "/ai-scan-v2" },
        { icon: Brain, label: t('nav.musicAnalysis'), url: "/ai-analysis" },
      ],
      requiresAuth: true,
    },
    {
      title: "Community",
      items: [
        { icon: Images, label: t('nav.fanwall'), url: "/fanwall" },
        { icon: Heart, label: t('nav.myLikes'), url: "/my/liked" },
        { icon: Trophy, label: t('nav.myQuizzes'), url: "/mijn-quizzen" },
        { icon: MessageCircle, label: t('nav.forum'), url: "/forum" },
      ],
      requiresAuth: true,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around h-14">
          {filteredNavItems.map((item) => {
            const isActive = item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-foreground transition-colors",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Hamburger menu button */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-foreground transition-colors",
                  menuOpen && "text-primary"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                  <h2 className="text-lg font-semibold">{t('common.menu')}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setMenuOpen(false)} className="p-1">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-4 space-y-6 pb-20">
                  {/* User info */}
                  {user && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <User className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setMenuOpen(false)}
                          className="text-xs text-primary hover:underline"
                        >
                          {t('nav.myProfile')}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Menu sections */}
                  {menuSections
                    .filter(section => !section.requiresAuth || user)
                    .map((section) => (
                      <div key={section.title}>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                          {section.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-1">
                          {section.items.map((item) => {
                            const isActive = currentPath === item.url;
                            return (
                              <Link
                                key={item.url + item.label}
                                to={item.url}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted",
                                  isActive && "bg-muted text-primary font-medium"
                                )}
                              >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* Login / Logout */}
                  <div className="border-t pt-4">
                    {user ? (
                      <Button
                        variant="ghost"
                        onClick={() => { signOut(); setMenuOpen(false); }}
                        className="w-full justify-start text-muted-foreground"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('nav.logout')}
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to="/auth" onClick={() => setMenuOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
                          {t('nav.login')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
