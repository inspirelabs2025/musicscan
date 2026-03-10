import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Disc3, LogIn, User, LayoutDashboard, LogOut, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const navLinks = [
  { label: 'Scan', href: '/ai-scan-v2' },
  { label: 'Verhalen', href: '/verhalen' },
  { label: 'Shop', href: '/shop' },
  { label: 'Quiz', href: '/quizzen' },
  { label: 'Magic Mike', href: '/echo' },
];

export function StickyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();

  const userInitial = user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Account';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(240_20%_12%/0.92)] backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg" onClick={() => setMenuOpen(false)}>
          <Disc3 className="w-6 h-6 text-vinyl-gold" />
          <span>MusicScan</span>
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
        <div className="flex items-center gap-2">
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
                  <Link to="/collectie" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                    <Library className="w-4 h-4" /> Mijn Collectie
                  </Link>
                  <Link to="/profiel" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                    <User className="w-4 h-4" /> Profiel
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-destructive"
                  >
                    <LogOut className="w-4 h-4" /> Uitloggen
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

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div className="bg-[hsl(240_20%_10%/0.98)] backdrop-blur-md border-t border-white/10 pb-4">
          <nav className="container mx-auto px-4 flex flex-col gap-1 pt-2">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
              >
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-vinyl-gold hover:bg-white/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="px-4 py-3 text-white/60 hover:bg-white/10 rounded-lg transition-colors font-medium flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Uitloggen
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-vinyl-gold hover:bg-white/10 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
