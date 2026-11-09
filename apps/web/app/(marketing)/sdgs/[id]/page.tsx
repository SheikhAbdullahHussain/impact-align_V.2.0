import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sdgNumberParamSchema } from '@impactalign/validation';
import { Badge, Container } from '@impactalign/ui';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { PageHero } from '@/components/marketing/page-hero';
import { TopicPage } from '@/components/marketing/topic-page';
import { SdgBrowser } from '@/components/sdg/sdg-browser';
import { fetchIndicators, fetchSdg, fetchTargets } from '@/lib/sdgs/api';
import { findTopic } from '@/lib/topics';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const parsed = sdgNumberParamSchema.safeParse({ id });
  if (!parsed.success) {
    const topic = findTopic('sdgs', id);
    return topic ? { title: topic.topic.title, description: topic.topic.description } : {};
  }
  return {
    title: `SDG ${parsed.data.id}`,
    alternates: { canonical: `/sdgs/${parsed.data.id}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const parsed = sdgNumberParamSchema.safeParse({ id });

  // Not a goal number: it may be a topic page such as /sdgs/sdg-goals.
  if (!parsed.success) {
    const found = findTopic('sdgs', id);
    if (!found) notFound();
    return <TopicPage section={found.section} topic={found.topic} />;
  }

  const number = parsed.data.id;
  const [sdg, targets, indicators] = await Promise.all([
    fetchSdg(number),
    fetchTargets(number),
    fetchIndicators(number),
  ]);
  if (!sdg) notFound();

  return (
    <>
      <PageHero
        title={sdg.title ?? `Sustainable Development Goal ${number}`}
        eyebrow={`SDG ${number}`}
        {...(sdg.description ? { intro: sdg.description } : {})}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'SDGs', href: '/sdgs' },
          { label: `SDG ${number}` },
        ]}
      />
      <Container className="py-12 md:py-16">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Badge tone="teal">{sdg.code}</Badge>
          {sdg.officialUrl && (
            <a
              href={sdg.officialUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="text-sm font-semibold text-navy-900 underline underline-offset-4"
            >
              Official source ↗
            </a>
          )}
        </div>

        <SdgBrowser targets={targets ?? []} indicators={indicators ?? []} />

        <nav aria-label="Goal navigation" className="mt-12 flex justify-between text-sm font-semibold">
          {number > 1 ? (
            <Link href={`/sdgs/${number - 1}`} className="text-navy-900 underline underline-offset-4">
              ← SDG {number - 1}
            </Link>
          ) : (
            <span />
          )}
          {number < 17 && (
            <Link href={`/sdgs/${number + 1}`} className="text-navy-900 underline underline-offset-4">
              SDG {number + 1} →
            </Link>
          )}
        </nav>
      </Container>
      <CtaBanner />
    </>
  );
}