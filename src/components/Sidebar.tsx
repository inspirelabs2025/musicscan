import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, SettingsIcon, FolderOpenDot, BrainIcon, ExternalLinkIcon, MenuIcon, XIcon, PlusCircle, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarProps {
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/projects', icon: HomeIcon },
    { name: 'AI Features', href: '/ai-features', icon: BrainIcon },
    // { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Instellingen', href: '/settings', icon: SettingsIcon },
  ];

  const renderSidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <Link to="/projects" className="flex items-center gap-2 font-semibold">
          <FolderOpenDot className="h-6 w-6 text-primary" />
          <span className="hidden lg:inline">FounderOS</span>
        </Link>
        <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${location.pathname.startsWith(item.href) ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}

          <Separator className="my-2" />

          <Link
            to="/new-project"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary`}
            onClick={() => setIsOpen(false)}
          >
            <PlusCircle className="h-4 w-4" />
            Nieuw Project
          </Link>
        </nav>
      </ScrollArea>
      {children} {/* Nudge component will be rendered here if passed as child */}
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground">
          <User className="h-4 w-4" />
          {user?.email || 'Gast'}
          <a
            href="https://founder-os.super.site/changelog"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Changelog <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed z-50 h-full w-[var(--sidebar-width)] flex-col border-r bg-sidebar md:flex">
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="h-9 w-9">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-64 p-0">
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-full">
        {renderSidebarContent()}
      </div>
    </div>
  );
};

export default Sidebar;
