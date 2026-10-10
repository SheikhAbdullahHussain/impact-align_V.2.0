'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@impactalign/ui';

export interface NavLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Match the path exactly (use for section roots such as /dashboard). */
  readonly exact?: boolean;
}

/** Link that exposes the current page to assistive technology via aria-current. */
export function NavLink({ href, children, className, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact || href === '/' ? pathname === href : pathname?.startsWith(href) === true;
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-semibold tracking-wide text-navy-900 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 aria-[current=page]:underline aria-[current=page]:decoration-gold-500 aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8',
        className,
      )}
    >
      {children}
    </Link>
  );
}
