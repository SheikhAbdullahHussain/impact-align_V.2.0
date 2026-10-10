import { Badge, Card, EmptyState } from '@impactalign/ui';
import {
  evidenceStatuses,
  getDashboardContent,
  getDashboardTitle,
  plannedFileTypes,
} from '@/lib/dashboard-content';

/** Generic dashboard screen: title, honest empty state and the capabilities planned for it. */
export function DashboardPage({ href }: { readonly href: string }) {
  const title = getDashboardTitle(href);
  const content = getDashboardContent(href);
  const showStatuses = href === '/dashboard/submissions';
  const showFileTypes = href === '/dashboard/uploads/new';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">{title}</h1>
        <p className="mt-2 text-navy-800">{content.description}</p>
      </header>

      <EmptyState
        title={content.emptyTitle}
        description="This feature is built in a later phase."
      />

      <Card>
        <h2 className="font-serif text-xl font-bold text-navy-900">Planned capabilities</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-navy-800">
          {content.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </Card>

      {showStatuses && (
        <Card>
          <h2 className="font-serif text-xl font-bold text-navy-900">Evidence statuses</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {evidenceStatuses.map((status) => (
              <li key={status}>
                <Badge>{status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showFileTypes && (
        <Card>
          <h2 className="font-serif text-xl font-bold text-navy-900">Planned file types</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {plannedFileTypes.map((type) => (
              <li key={type}>
                <Badge tone="teal">{type}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
