import Link from 'next/link';
import { Container } from '@impactalign/ui';
import { legalPages, publicNav, siteConfig } from '@impactalign/config';
import { BrandMark } from './brand-mark';

const linkClass =
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400';

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white">
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-navy-900 via-teal-700 to-gold-500"
      />
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-xl font-bold">
            <BrandMark className="size-8" />
            {siteConfig.name}
          </p>
          <p className="mt-3 max-w-sm text-sm text-navy-100">{siteConfig.tagline}</p>
          <p className="mt-3 max-w-sm text-sm text-navy-200">
            AI assists. Qualified human assessors make every final validation and accreditation
            decision.
          </p>
        </div>
        <nav aria-label="Site">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-400">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-400">Legal</h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link href={`/${page.slug}`} className={linkClass}>
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-white/10 py-5 text-xs text-navy-200">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved. site is under
          development.
        </p>
      </Container>
    </footer>
  );
}
