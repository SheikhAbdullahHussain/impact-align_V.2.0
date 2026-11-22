import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CONTENT_KEYS, CONTENT_KINDS, type ContentKind } from '@impactalign/types';
import { FaqEditor } from '@/components/content/faq-editor';
import { LegalEditor } from '@/components/content/legal-editor';
import { SectionEditor } from '@/components/content/section-editor';

export const metadata = { title: 'Edit content' };

export default async function Page({ params }: { params: Promise<{ kind: string; key: string }> }) {
  const { kind, key } = await params;
  const upper = kind.toUpperCase();
  if (!(CONTENT_KINDS as readonly string[]).includes(upper)) notFound();
  const entry = CONTENT_KEYS[upper as ContentKind].find((k) => k.key === key);
  if (!entry) notFound();

  if (upper === 'LEGAL') return <LegalEditor contentKey={key} label={entry.label} />;
  if (upper === 'FAQ') return <FaqEditor contentKey={key} label={entry.label} />;
  if (upper === 'SECTION') return <SectionEditor contentKey={key} label={entry.label} />;

  return (
    <section className="space-y-3">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{entry.label}</h1>
      <p className="text-navy-800">The editor for this content type is coming next.</p>
      <Link href="/console/content" className="font-semibold underline underline-offset-4">
        Back to website content
      </Link>
    </section>
  );
}
