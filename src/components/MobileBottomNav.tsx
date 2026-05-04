import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, ShoppingCart, Trophy, Menu, X, User, LogIn, LogOut, Music, Images, Brain, MessageCircle, DollarSign, BarChart3, Newspaper, Headphones, Clock, Calendar, BookOpen, Sparkles, CircleDot, Youtube, Globe, Flag, Building2, Store, Library, Package, Heart, Users, Archive, Disc3, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { hardReset } from "@/utils/appReset";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MobileBottomNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t, tr, language } = useLanguage();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const m = tr.miscUI;

  const bottomPadding = 'max(env(safe-area-inset-bottom), 8px)';

  const navItems = [
    { icon: Home, label: t('nav.home'), url: "/" },
    { icon: ScanLine, label: m.scan, url: "/ai-scan-v2" },
    { icon: Library, label: m.collection, url: "/my-collection", requiresAuth: true },
    { icon: Trophy, label: m.quiz, url: "/quizzen" },
  ];

  const filteredNavItems = navItems.filter(item => !('requiresAuth' in item && item.requiresAuth && !user));

  const menuSections = [
    {
      title: t('nav.scanCollection'),
      items: [
        
        { icon: Brain, label: t('nav.smartScan'), url: "/ai-scan-v2" },
        { icon: Music, label: t('nav.myCollection'), url: "/my-collection" },
        { icon: Disc3, label: m.myDiscogs, url: "/mijn-discogs" },
        { icon: MessageCircle, label: language === 'nl' ? 'Discogs Berichten' : 'Discogs Messages', url: "/discogs-messages" },
        { icon: BarChart3, label: t('nav.collectionInsight'), url: "/collection-overview" },
      ],
      requiresAuth: true,
    },
    // Shop sectie verwijderd
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
    // Community sectie verwijderd
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t supports-[backdrop-filter]:bg-background/60"
        style={{
          paddingBottom: bottomPadding,
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="flex items-center justify-around h-14">
          {filteredNavItems.map((item) => {
            const isActive = item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 h-full text-foreground transition-colors",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden xs:block text-[10px] font-medium truncate w-full text-center px-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* Hamburger menu button */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 h-full text-foreground transition-colors",
                  menuOpen && "text-primary"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="hidden xs:block text-[10px] font-medium truncate w-full text-center px-0.5">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                  <h2 className="text-lg font-semibold text-foreground">{t('common.menu')}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMenuOpen(false)}
                    className="h-11 w-11 min-h-[44px] rounded-full bg-background/95 text-foreground border border-border shadow-md hover:bg-background"
                  >
                    <X className="h-5 w-5 stroke-[2.5]" />
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
                          to="/profile"
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

                  {/* App resetten — noodknop voor vastlopende cache/state */}
                  <div className="pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs text-muted-foreground/70 hover:text-foreground"
                        >
                          <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                          {language === 'nl' ? 'App resetten' : 'Reset app'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {language === 'nl' ? 'App opnieuw instellen?' : 'Reset the app?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === 'nl'
                              ? 'Hiermee wis je de lokale opslag van de app. Je wordt uitgelogd en moet opnieuw inloggen. Gebruik dit alleen als de app raar doet of niet meer werkt zoals verwacht. Je collectie en gegevens op de server blijven behouden.'
                              : 'This clears the app\'s local storage. You will be logged out and need to sign in again. Use this only if the app is misbehaving. Your collection and data on the server are not affected.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {language === 'nl' ? 'Annuleren' : 'Cancel'}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setMenuOpen(false);
                              void hardReset();
                            }}
                          >
                            {language === 'nl' ? 'Ja, app resetten' : 'Yes, reset app'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
