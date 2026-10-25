import Link from 'next/link';
import { Card } from '@impactalign/ui';

export interface LinkCardItem {
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

export function LinkCards({ items }: { readonly items: readonly LinkCardItem[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.href}>
          <Card interactive className="relative h-full">
            <h3 className="font-serif text-2xl font-bold text-navy-900">
              <Link href={item.href} className="after:absolute after:inset-0 focus:outline-none">
                {item.title}
              </Link>
            </h3>
            <p className="mt-2 text-navy-800">{item.description}</p>
            <p aria-hidden="true" className="mt-4 font-semibold text-teal-700">
              Learn more →
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
