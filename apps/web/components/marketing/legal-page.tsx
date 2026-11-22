import { Container } from '@impactalign/ui';
import type { LegalContentDto } from '@impactalign/types';
import { getPublishedContent } from '@/lib/site-content';
import { LegalBody } from './legal-body';
import { LegalPlaceholder } from './legal-placeholder';
import { PageHero } from './page-hero';

/** Published legal text from the admin panel; the built-in placeholder until then. */
export async function LegalPage({ slug }: { readonly slug: string }) {
  const published = await getPublishedContent<LegalContentDto>('legal', slug);
  if (!published) return <LegalPlaceholder slug={slug} />;
  return (
    <>
      <PageHero
        title={published.title}
        eyebrow="Legal"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Legal' }, { label: published.title }]}
      />
      <Container className="max-w-3xl py-12 md:py-16">
        <LegalBody text={published.body} />
      </Container>
    </>
  );
}
