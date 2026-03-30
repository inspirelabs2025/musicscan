import { ReactNode } from 'react';
import { AppLayout } from './app-layout';

interface MainLayoutProps {
  children: ReactNode;
  showMenu?: boolean;
  showSearch?: boolean;
}

export function MainLayout({
  children,
  showMenu = true,
  showSearch = true,
}: MainLayoutProps) {
  return (
    <AppLayout showMenu={showMenu} showSearch={showSearch}>
      {children}
    </AppLayout>
  );
}

export default MainLayout;