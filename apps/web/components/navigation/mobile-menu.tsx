'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@impactalign/ui';
import type { NavItem } from '@impactalign/config';
import { NavLink } from './nav-link';

export interface MobileMenuProps {
  readonly items: readonly NavItem[];
  readonly cta: NavItem;
}

/** Disclosure-pattern menu for small screens: button + list, closes on Escape and navigation. */
export function MobileMenu({ items, cta }: MobileMenuProps) {
  // The menu is open only for the path it was opened on, so navigating closes it without an effect.
  const pathname = usePathname() ?? '';
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (next: boolean) => setOpenPath(next ? pathname : null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPath(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close menu' : 'Menu'}
      </Button>
      <nav
        id={panelId}
        aria-label="Mobile"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-navy-100 bg-white px-4 pb-4 shadow-lg"
      >
        <ul className="flex flex-col gap-1 pt-2">
          {items.map((item) => (
            <li key={item.href}>
              <NavLink href={item.href} className="block py-3 text-base">
                {item.label}
              </NavLink>
            </li>
          ))}
          <li className="pt-2">
            <Button asChild variant="accent" className="w-full">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
