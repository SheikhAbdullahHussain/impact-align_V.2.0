import { cn } from '../lib/cn';

export interface SkipLinkProps {
  readonly targetId?: string;
  readonly className?: string;
}

/** First focusable element on every page — lets keyboard users bypass navigation. */
export function SkipLink({ targetId = 'main-content', className }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900 focus:shadow-lg',
        className,
      )}
    >
      Skip to main content
    </a>
  );
}
