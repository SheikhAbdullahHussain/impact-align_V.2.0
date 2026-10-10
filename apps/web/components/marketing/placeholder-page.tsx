import Link from 'next/link';
import { Button, Container } from '@impactalign/ui';

export interface PlaceholderPageProps {
  readonly title: string;
  readonly description: string;
}

/** Clearly-marked placeholder for public sections whose content arrives in a later phase. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Container className="py-16 md:py-24">
      <h1 className="font-serif text-4xl font-bold text-navy-900 md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-navy-800">{description}</p>
      <p
        role="note"
        className="mt-8 max-w-2xl rounded-md border border-gold-500 bg-gold-400/10 p-4 text-sm text-navy-900"
      >
        Placeholder: this section is under development and contains no final content yet.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </Container>
  );
}
