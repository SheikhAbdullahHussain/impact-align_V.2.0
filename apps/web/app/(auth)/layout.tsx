import Link from 'next/link';
import { SkipLink } from '@impactalign/ui';
import { siteConfig } from '@impactalign/config';
import { BrandMark } from '@/components/layout/brand-mark';

/** Sign-in area shell: separate from the public marketing layout and never indexed. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-navy-50">
      <SkipLink />
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-navy-900">
            <BrandMark className="size-7" />
            {siteConfig.name}
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-md px-4 py-12 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
