import { Container } from '@impactalign/ui';
import { getLegalPage } from '@/lib/legal';
import { PageHero } from './page-hero';

export function LegalPlaceholder({ slug }: { readonly slug: string }) {
  const { title } = getLegalPage(slug);
  return (
    <>
      <PageHero
        title={title}
        eyebrow="Legal"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Legal' }, { label: title }]}
      />
      <Container className="max-w-3xl py-12 md:py-16">
        <p role="note" className="rounded-md border border-gold-500 bg-gold-50 p-5 text-navy-900">
          This page is a placeholder. The final text must be drafted and reviewed by qualified legal
          counsel before launch. Nothing on this page is a legal commitment, certification or
          compliance claim.
        </p>
      </Container>
    </>
  );
}
