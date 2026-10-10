import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const cardVariants = cva('rounded-xl border p-6', {
  variants: {
    tone: {
      light: 'border-navy-100 bg-white shadow-sm',
      muted: 'border-navy-100 bg-navy-50',
      dark: 'border-white/10 bg-white/5 text-white',
    },
    interactive: {
      true: 'transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-teal-600',
      false: '',
    },
  },
  defaultVariants: { tone: 'light', interactive: false },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, tone, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tone, interactive }), className)} {...props} />;
}
