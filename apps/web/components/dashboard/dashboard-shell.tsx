import Link from 'next/link';
import { Badge, Container, SkipLink } from '@impactalign/ui';
import { siteConfig } from '@impactalign/config';
import { BrandMark } from '@/components/layout/brand-mark';
import { DashboardNavList } from './dashboard-nav';
import { PreviewBanner } from './preview-banner';

/** Authenticated-area chrome (kept separate from the public marketing layout). */
export function DashboardShell({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-navy-50">
      <SkipLink />
      <header className="border-b border-navy-100 bg-white">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-navy-900">
            <BrandMark className="size-7" />
            {siteConfig.shortName}
          </Link>
          <div className="flex items-center gap-3">
            <Badge tone="gold">Preview · not signed in</Badge>
            <Link
              href="/"
              className="text-sm font-semibold text-navy-900 underline-offset-4 hover:underline"
            >
              Back to site
            </Link>
          </div>
        </Container>
      </header>

      <Container className="grid gap-6 py-6 lg:grid-cols-[16rem_1fr]">
        <aside>
          <details className="rounded-xl border border-navy-100 bg-white p-3 lg:hidden">
            <summary className="cursor-pointer font-semibold text-navy-900">Dashboard menu</summary>
            <nav aria-label="Dashboard (mobile)" className="mt-3">
              <DashboardNavList />
            </nav>
          </details>
          <nav
            aria-label="Dashboard"
            className="hidden rounded-xl border border-navy-100 bg-white p-3 lg:block"
          >
            <DashboardNavList />
          </nav>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 focus:outline-none">
          <PreviewBanner />
          {children}
        </main>
      </Container>
    </div>
  );
}
