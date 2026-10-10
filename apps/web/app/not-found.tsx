import Link from 'next/link';
import { Button, Container } from '@impactalign/ui';

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-dvh items-center bg-navy-950 text-white">
      <Container className="py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-400">Error 404</p>
        <h1 className="mt-2 font-serif text-4xl font-bold md:text-5xl">Page not found</h1>
        <p className="mt-4 max-w-xl text-navy-100">
          The page you requested does not exist or may have moved.
        </p>
        <Button asChild variant="accent" className="mt-8">
          <Link href="/">Go to home</Link>
        </Button>
      </Container>
    </main>
  );
}
