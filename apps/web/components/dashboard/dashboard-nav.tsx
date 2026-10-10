'use client';

import { cn } from '@impactalign/ui';
import { dashboardNav } from '@impactalign/config';
import { NavLink } from '@/components/navigation/nav-link';

/** Sidebar link list. `/dashboard` matches exactly so it is not "current" on every sub-page. */
export function DashboardNavList({ className }: { readonly className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {dashboardNav.map((item) => (
        <li key={item.href}>
          <NavLink href={item.href} exact={item.href === '/dashboard'} className="block">
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
