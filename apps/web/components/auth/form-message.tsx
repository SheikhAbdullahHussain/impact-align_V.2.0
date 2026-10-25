import { cn } from '@impactalign/ui';

/** Error (role=alert, announced immediately) or success (role=status) message above a form. */
export function FormMessage({
  kind,
  children,
}: {
  readonly kind: 'error' | 'success';
  readonly children: React.ReactNode;
}) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border p-3 text-sm',
        kind === 'error'
          ? 'border-red-700 bg-red-50 text-red-900'
          : 'border-teal-700 bg-teal-50 text-teal-900',
      )}
    >
      {children}
    </p>
  );
}
