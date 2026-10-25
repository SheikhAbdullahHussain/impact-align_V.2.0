import Link from 'next/link';
import { Button, Container } from '@impactalign/ui';
import { joinNav, loginNav, publicNav, siteConfig } from '@impactalign/config';
import { MobileMenu } from '@/components/navigation/mobile-menu';
import { NavLink } from '@/components/navigation/nav-link';
import { BrandMark } from './brand-mark';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-navy-900 via-teal-700 to-gold-500"
      />
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif text-lg font-bold text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          <BrandMark className="size-8" />
          {siteConfig.name}
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {[...publicNav, loginNav].map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
            <li className="pl-2">
              <Button asChild variant="accent" size="sm">
                <Link href={joinNav.href}>{joinNav.label}</Link>
              </Button>
            </li>
          </ul>
        </nav>

        <MobileMenu items={[...publicNav, loginNav]} cta={joinNav} />
      </Container>
    </header>
  );
}
