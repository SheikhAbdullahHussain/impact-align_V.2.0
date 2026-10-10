import * as React from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: string;
  readonly description?: string;
}

/** Friendly placeholder for screens that have no data (or no feature) yet. */
export function EmptyState({ title, description, className, children, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-navy-300 bg-navy-50 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      <p className="font-serif text-xl font-bold text-navy-900">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-xl text-navy-800">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
