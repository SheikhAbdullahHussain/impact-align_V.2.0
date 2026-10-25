import Link from 'next/link';
import { Badge, Button, Container } from '@impactalign/ui';
import { joinNav, siteConfig } from '@impactalign/config';
import { ChainCard } from './chain-card';

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-navy-950 bg-[radial-gradient(60rem_30rem_at_80%_-10%,rgba(201,162,39,0.18),transparent),radial-gradient(40rem_25rem_at_-10%_110%,rgba(15,118,110,0.25),transparent)] text-white"
    >
      <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Badge tone="onDark">AI-assisted · Human-validated</Badge>
          <h1
            id="hero-heading"
            className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl"
          >
            Turn sustainability work into verifiable SDG impact
          </h1>
          <p className="mt-6 max-w-xl text-lg text-navy-100">{siteConfig.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href={joinNav.href}>{joinNav.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="border border-white/40 text-white hover:bg-white/10"
            >
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm tracking-wide text-navy-200">{siteConfig.tagline}</p>
        </div>
        <ChainCard />
      </Container>
    </section>
  );
}
