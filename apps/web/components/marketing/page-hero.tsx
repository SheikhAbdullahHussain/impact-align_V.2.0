import { Container } from '@impactalign/ui';
import { Breadcrumbs, type Crumb } from '@/components/navigation/breadcrumbs';

export interface PageHeroProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly intro?: string;
  readonly crumbs: readonly Crumb[];
}

/** Banner for inner pages: breadcrumbs, eyebrow, the page's single h1 and an intro. */
export function PageHero({ title, eyebrow, intro, crumbs }: PageHeroProps) {
  return (
    <div className="bg-navy-950 bg-[radial-gradient(40rem_20rem_at_90%_-20%,rgba(201,162,39,0.18),transparent)] text-white">
      <Container className="py-12 md:py-16">
        <Breadcrumbs items={crumbs} />
        {eyebrow && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-gold-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-serif text-4xl font-bold md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-3xl text-lg text-navy-100">{intro}</p>}
      </Container>
    </div>
  );
}
