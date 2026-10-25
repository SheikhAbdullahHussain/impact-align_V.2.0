import { Container, cn } from '@impactalign/ui';

export interface SectionProps {
  readonly id: string;
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly tone?: 'light' | 'muted' | 'dark';
  readonly children: React.ReactNode;
}

const toneClasses = {
  light: 'bg-white text-navy-950',
  muted: 'bg-navy-50 text-navy-950',
  dark: 'bg-navy-950 text-white',
} as const;

/** Standard page section: labelled landmark with eyebrow, heading and optional description. */
export function Section({
  id,
  title,
  eyebrow,
  description,
  tone = 'light',
  children,
}: SectionProps) {
  const dark = tone === 'dark';
  return (
    <section aria-labelledby={`${id}-heading`} className={cn('py-16 md:py-20', toneClasses[tone])}>
      <Container>
        <header className="max-w-3xl">
          {eyebrow && (
            <p
              className={cn(
                'text-sm font-semibold uppercase tracking-widest',
                dark ? 'text-gold-400' : 'text-teal-700',
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2 id={`${id}-heading`} className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            {title}
          </h2>
          {description && (
            <p className={cn('mt-4 text-lg', dark ? 'text-navy-100' : 'text-navy-800')}>
              {description}
            </p>
          )}
        </header>
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}
