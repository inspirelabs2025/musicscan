import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbStructuredData } from './StructuredData';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ 
  items, 
  className 
}) => {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', url: '/' }];
    
    const routeNames: Record<string, string> = {
      'scanner': 'Music Scanner',
      'scan': 'Scan Results',
      'my-collection': 'My Collection',
      'ai-analysis': 'AI Analysis',
      'collection-chat': 'Collection Chat',
      'public-catalog': 'Public Catalog',
      'public-shops-overview': 'Public Shops',
      'music-news': 'Music News',
      'auth': 'Login',
      'release': 'Album Details',
      'shop': 'Shop',
      'collection': 'Collection'
    };
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Skip if it's the last segment and we're already at home
      if (index === pathSegments.length - 1 && currentPath === '/') return;
      
      breadcrumbs.push({
        name,
        url: currentPath
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/' && !items) {
    return null;
  }
  
  return (
    <div className={className}>
      <BreadcrumbStructuredData items={breadcrumbs} />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.url}>
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {index === 0 && <Home className="h-4 w-4" />}
                    {item.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.url} className="flex items-center gap-2 hover:text-primary transition-colors">
                      {index === 0 && <Home className="h-4 w-4" />}
                      {item.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};