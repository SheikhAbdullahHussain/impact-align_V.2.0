import Link from 'next/link';
import type { PublicUser } from '@impactalign/types';
import { Container, SkipLink } from '@impactalign/ui';
import { siteConfig } from '@impactalign/config';
import { BrandMark } from '@/components/layout/brand-mark';
import { DashboardNavList } from './dashboard-nav';
import { LogoutButton } from './logout-button';
import { PreviewBanner } from './preview-banner';

export interface DashboardShellProps {
  readonly user: Pick<PublicUser, 'displayName'>;
  readonly children?: React.ReactNode;
}

/** Signed-in area chrome (kept separate from the public marketing layout). */
export function DashboardShell({ user, children }: DashboardShellProps) {
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
            <span className="hidden text-sm text-navy-800 sm:inline">
              Signed in as <strong className="text-navy-900">{user.displayName}</strong>
            </span>
            <LogoutButton />
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
