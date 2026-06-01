import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home' },
  { to: '/students',  icon: Users,           label: 'Students' },
  { to: '/reminders', icon: Bell,            label: 'Reminders' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-surface-200 pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 min-h-[64px] gap-1 transition-colors',
                isActive
                  ? 'text-brand-500'
                  : 'text-surface-400 hover:text-surface-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
                <span className={cn('text-xs font-medium', isActive && 'font-bold')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
