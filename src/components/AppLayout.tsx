import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', icon: Receipt },
  { label: 'Insights', path: '/insights', icon: TrendingUp },
  { label: 'Settings', path: '/settings', icon: Settings },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 sticky top-0 h-screen">
          <div className="p-6 border-b border-border">
            <h1 className="text-lg font-bold text-foreground tracking-tight">💰 Prajwal Tracker</h1>
            {user && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {user.username}
              </p>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-foreground">💰 Prajwal Tracker</h1>
              {user && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.username}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              {NAV_ITEMS.find(item => item.path === pathname)?.label || 'Dashboard'}
            </h1>
          </header>
        )}

        <main className={cn('flex-1 overflow-auto', isMobile ? 'pb-24 px-4 pt-4' : 'p-6 pt-0')}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex justify-around py-2 px-2">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                  pathname === item.path
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
