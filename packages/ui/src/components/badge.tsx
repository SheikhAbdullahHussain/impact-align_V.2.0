import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'bg-navy-100 text-navy-900',
        gold: 'bg-gold-400/20 text-navy-900 ring-1 ring-inset ring-gold-500',
        teal: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/30',
        onDark: 'bg-white/10 text-white ring-1 ring-inset ring-white/30',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
