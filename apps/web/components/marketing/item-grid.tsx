import Link from 'next/link';
import { Badge, Card, cn } from '@impactalign/ui';
import type { TitledItem } from '@/lib/home-content';

export interface ItemGridProps {
  readonly items: readonly (TitledItem & { readonly status?: string; readonly href?: string })[];
  readonly columns?: 2 | 3;
  readonly tone?: 'light' | 'muted';
}

const columnClasses = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
} as const;

/** Responsive grid of title + description cards (used for values, audiences, features, topics). */
export function ItemGrid({ items, columns = 3, tone = 'light' }: ItemGridProps) {
  return (
    <ul className={cn('grid gap-5', columnClasses[columns])}>
      {items.map((item) => (
        <li key={item.title}>
          <Card tone={tone} interactive={Boolean(item.href)} className="relative h-full">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl font-bold text-navy-900">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="after:absolute after:inset-0 focus:outline-none"
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </h3>
              {item.status && <Badge tone="gold">{item.status}</Badge>}
            </div>
            <p className="mt-2 text-navy-800">{item.description}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
