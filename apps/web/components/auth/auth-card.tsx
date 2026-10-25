import Link from 'next/link';
import { Card } from '@impactalign/ui';

export interface AuthCardProps {
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly footer?: { readonly text: string; readonly linkLabel: string; readonly href: string };
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{title}</h1>
      {description && <p className="mt-2 text-navy-800">{description}</p>}
      <div className="mt-6">{children}</div>
      {footer && (
        <p className="mt-6 text-sm text-navy-800">
          {footer.text}{' '}
          <Link
            href={footer.href}
            className="font-semibold text-navy-900 underline underline-offset-4"
          >
            {footer.linkLabel}
          </Link>
        </p>
      )}
    </Card>
  );
}
