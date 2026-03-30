import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './header';
import { Menu } from './menu';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { ReactNode } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { AINudge } from '@/components/ainudge';

interface AppLayoutProps {
	children?: ReactNode;
	showMenu?: boolean;
	showSearch?: boolean;
}

export function AppLayout({ children, showMenu = true, showSearch = true }: AppLayoutProps) {
	const location = useLocation();
	const { toggleMenu } = useMenu();
	const { theme } = useTheme();

	// Close menu when route changes	
	useEffect(() => {
		toggleMenu(false);
	}, [location, toggleMenu]);

	useEffect(() => {
		document.title = 'Melodify';
		let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
		if (meta) meta.content = 'Melodify: De beste app om jouw muziek te creëren, distribueren en te promoten.';
	}, []);

	return (
		<div
			className={cn(
				'grid min-h-screen w-full',
				showMenu && 'lg:grid-cols-[280px_1fr]',
				{ 'bg-card-dark text-card-dark-foreground': theme === 'dark' },
				{ 'bg-card-purple text-card-purple-foreground': theme === 'purple' }
			)}
		>
			{showMenu && <Menu />}

			<div className={cn('flex flex-col min-w-0', showMenu && 'lg:col-start-2')}>
				<Header showSearch={showSearch} />
				<ScrollArea className="flex-1">
					<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
						{children || <Outlet />}
						<div className="fixed bottom-4 right-4 z-50">
							<AINudge />
						</div>
					</main>
				</ScrollArea>
			</div>
			<Toaster />
		</div>
	);
}
