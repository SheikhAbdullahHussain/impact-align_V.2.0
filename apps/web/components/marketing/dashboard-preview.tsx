import { Badge, Card } from '@impactalign/ui';
import { dashboardMetrics } from '@/lib/home-content';

/** Layout preview only: every value is an empty placeholder — there is no data and no dashboard yet. */
export function DashboardPreview() {
  return (
    <Card tone="muted" className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-serif text-lg font-bold text-navy-900">Impact dashboard</p>
        <Badge tone="gold">Sample layout — no real data</Badge>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {dashboardMetrics.map((metric) => (
          <li key={metric} className="rounded-lg border border-navy-100 bg-white p-4">
            <p className="text-sm text-navy-800">{metric}</p>
            <p
              aria-label="No value yet"
              className="mt-2 font-serif text-3xl font-bold text-navy-300"
            >
              —
            </p>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="mt-4 grid grid-cols-12 items-end gap-2 rounded-lg border border-navy-100 bg-white p-4"
      >
        {[40, 65, 30, 80, 55, 70, 45, 90, 35, 60, 75, 50].map((height, index) => (
          <span key={index} className="rounded-t bg-navy-100" style={{ height: `${height}px` }} />
        ))}
      </div>
    </Card>
  );
}
