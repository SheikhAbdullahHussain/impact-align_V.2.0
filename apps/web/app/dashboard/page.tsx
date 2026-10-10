import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@impactalign/ui';
import { dashboardNav } from '@impactalign/config';
import { dashboardMetrics } from '@/lib/home-content';

export const metadata: Metadata = { title: 'Dashboard' };

const quickLinks = dashboardNav.filter((item) =>
  [
    '/dashboard/projects',
    '/dashboard/uploads/new',
    '/dashboard/submissions',
    '/dashboard/accreditation',
  ].includes(item.href),
);

export default function DashboardHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">Dashboard</h1>
        <p className="mt-2 text-navy-800">Your impact alignment at a glance.</p>
      </header>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboardMetrics.map((metric) => (
            <li key={metric}>
              <Card className="h-full">
                <p className="text-sm font-semibold text-navy-800">{metric}</p>
                <p
                  aria-label="No value yet"
                  className="mt-3 font-serif text-4xl font-bold text-navy-300"
                >
                  —
                </p>
                <p className="mt-1 text-xs text-navy-700">No data yet</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="font-serif text-xl font-bold text-navy-900">
          Quick links
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-navy-100 bg-white p-4 font-semibold text-navy-900 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {item.label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
