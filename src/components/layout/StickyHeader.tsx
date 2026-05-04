import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from 'react-router-dom';
import { Menu, X, Disc3, LogIn, User, LayoutDashboard, LogOut, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';

const useNavLinks = () => {
  const { language } = useLanguage();
  const links = [
    { label: 'Scan', href: '/ai-scan-v2' },
    { label: language === 'nl' ? 'Verhalen' : 'Stories', href: '/verhalen' },
    { label: 'Shop', href: '/shop' },
    { label: 'Quiz', href: '/quizzen' },
    ...(language === 'nl' ? [{ label: 'Podcasts', href: '/podcasts' }] : []),
    { label: 'Magic Mike', href: '/echo' },
  ];
  return links;
};

const useMenuLabels = () => {
  const { language } = useLanguage();
  return {
    myCollection: language === 'nl' ? 'Mijn Collectie' : 'My Collection',
    profile: language === 'nl' ? 'Profiel' : 'Profile',
    logout: language === 'nl' ? 'Uitloggen' : 'Log out',
  };
};

export function StickyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navLinks = useNavLinks();
  const menuLabels = useMenuLabels();

  const userInitial = user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Account';

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
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg min-w-0 flex-shrink" onClick={() => setMenuOpen(false)}>
          <Disc3 className="w-6 h-6 text-vinyl-gold flex-shrink-0" />
          <span className="truncate">MusicScan</span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <nav className="flex items-center gap-1">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {!isMobile && (
            user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/80 font-medium max-w-[100px] truncate">{displayName}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                    <Link to="/mijn-collectie" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                      <Library className="w-4 h-4" /> {menuLabels.myCollection}
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                      <User className="w-4 h-4" /> {menuLabels.profile}
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-destructive"
                    >
                      <LogOut className="w-4 h-4" /> {menuLabels.logout}
                    </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Link>
              </Button>
            )
          )}

        </div>
      </div>
    </header>
  );
}
