import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TopicPage } from '@/components/marketing/topic-page';
import { findTopic } from '@/lib/topics';

type Params = Promise<{ section: string; topic: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { section, topic } = await params;
  const found = findTopic(section, topic);
  if (!found) return {};
  return {
    title: `${found.topic.title} — ${found.section.title}`,
    description: found.topic.description,
    alternates: { canonical: `/${section}/${topic}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { section, topic } = await params;
  const found = findTopic(section, topic);
  if (!found) notFound();
  return <TopicPage section={found.section} topic={found.topic} />;
}
