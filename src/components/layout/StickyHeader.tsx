import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from 'react-router-dom';
import {
  Disc3, LogIn, User, LayoutDashboard, LogOut, Library,
  ChevronDown, Home, ScanLine, Brain, Music, MessageCircle,
  MessageSquare, DollarSign, BarChart3, Headphones, Trophy, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

type DropdownItem = {
  label: string;
  href: string;
  icon: typeof Music;
  requiresAuth?: boolean;
};

type NavDropdownProps = {
  label: string;
  icon: typeof Music;
  items: DropdownItem[];
  isLoggedIn: boolean;
};

// Each dropdown is its own component so its open-state is fully isolated.
// (The previous version shared one state across three Popovers and that
// triggered a render crash on the Home route â keeping things isolated
// avoids any cross-dropdown state coupling.)
function NavDropdown({ label, icon: Icon, items, isLoggedIn }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const visibleItems = items.filter((item) => !item.requiresAuth || isLoggedIn);
  if (visibleItems.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            'flex items-center gap-1.5 px-3 py-2 text-sm font-medium ' +
            'text-white/70 hover:text-white transition-colors rounded-lg ' +
            'hover:bg-white/10 ' +
            (open ? 'bg-white/10 text-white' : '')
          }
        >
          <Icon className="w-4 h-4" />
          {label}
          <ChevronDown
            className={
              'w-3.5 h-3.5 transition-transform ' +
              (open ? 'rotate-180' : '')
            }
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5 bg-popover" sideOffset={8}>
        {visibleItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-foreground"
            >
              <ItemIcon className="w-4 h-4 text-muted-foreground" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

const useMenuLabels = () => {
  const { language } = useLanguage();
  return {
    myCollection: language === 'nl' ? 'Mijn Collectie' : 'My Collection',
    profile: language === 'nl' ? 'Profiel' : 'Profile',
    logout: language === 'nl' ? 'Uitloggen' : 'Log out',
  };
};

export function StickyHeader() {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const menuLabels = useMenuLabels();

  const isLoggedIn = !!user;
  const nl = language === 'nl';

  // Build dropdowns inline â keeps everything in one render cycle
  // and avoids any shared state across instances.
  const scanCollectieItems: DropdownItem[] = [
    { label: t('nav.smartScan'), href: '/ai-scan-v2', icon: Brain },
    { label: t('nav.myCollection'), href: '/my-collection', icon: Music, requiresAuth: true },
    { label: t('nav.myDiscogs'), href: '/mijn-discogs', icon: Disc3, requiresAuth: true },
    { label: nl ? 'Discogs Berichten' : 'Discogs Messages', href: '/discogs-messages', icon: MessageSquare, requiresAuth: true },
    { label: t('nav.collectionInsight'), href: '/collection-overview', icon: BarChart3, requiresAuth: true },
  ];

  const slimmeToolsItems: DropdownItem[] = [
    { label: t('nav.echo'), href: '/echo', icon: Music },
    { label: t('nav.chatCollection'), href: '/collection-chat', icon: MessageCircle, requiresAuth: true },
    { label: t('nav.priceCheck'), href: '/quick-price-check', icon: DollarSign },
    { label: t('nav.musicAnalysis'), href: '/ai-analysis', icon: Brain, requiresAuth: true },
  ];

  const verhalenItems: DropdownItem[] = [
    { label: t('nav.singles'), href: '/singles', icon: Music },
    { label: t('nav.artists'), href: '/artists', icon: Users },
    { label: t('nav.podcasts'), href: '/podcasts', icon: Headphones },
  ];

  const userInitial =
    user?.user_metadata?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';
  const displayName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Account';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-[hsl(240_20%_12%/0.92)] backdrop-blur-md border-b border-white/10"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-lg min-w-0 flex-shrink"
        >
          <Disc3 className="w-6 h-6 text-vinyl-gold flex-shrink-0" />
          <span className="truncate">MusicScan</span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              {t('nav.home')}
            </Link>

            <NavDropdown
              label={t('nav.scanCollection')}
              icon={ScanLine}
              items={scanCollectieItems}
              isLoggedIn={isLoggedIn}
            />

            <NavDropdown
              label={t('nav.smartTools')}
              icon={Brain}
              items={slimmeToolsItems}
              isLoggedIn={isLoggedIn}
            />

            <NavDropdown
              label={nl ? 'Verhalen' : 'Stories'}
              icon={Headphones}
              items={verhalenItems}
              isLoggedIn={isLoggedIn}
            />

            <Link
              to="/quizzen"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <Trophy className="w-4 h-4" />
              {t('nav.quiz')}
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {!isMobile &&
            (user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/80 font-medium max-w-[100px] truncate">
                      {displayName}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to="/mijn-collectie"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    <Library className="w-4 h-4" /> {menuLabels.myCollection}
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" /> {menuLabels.profile}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-destructive"
                  >
                    <LogOut className="w-4 h-4" /> {menuLabels.logout}
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
              >
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  {nl ? 'Inloggen' : 'Login'}
                </Link>
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
