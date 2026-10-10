import Link from 'next/link';
import { Button, Container } from '@impactalign/ui';
import { joinNav } from '@impactalign/config';

export function CtaBanner() {
  return (
    <section aria-labelledby="cta-heading" className="bg-gold-50 py-16">
      <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2 id="cta-heading" className="font-serif text-3xl font-bold text-navy-900">
            Ready to align your impact with the SDGs?
          </h2>
          <p className="mt-2 text-lg text-navy-800">
            Join the community and be among the first to use ImpactAlign as it launches.
          </p>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link href={joinNav.href}>{joinNav.label}</Link>
        </Button>
      </Container>
    </section>
  );
}
