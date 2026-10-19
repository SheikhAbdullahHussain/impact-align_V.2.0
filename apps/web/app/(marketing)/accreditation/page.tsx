import type { Metadata } from 'next';
import { Container } from '@impactalign/ui';
import { PageHero } from '@/components/marketing/page-hero';
import { CtaBanner } from '@/components/marketing/cta-banner';

export const metadata: Metadata = {
  title: 'Accreditation Journey',
  description:
    'Learn how ImpactAlign plans to support SDG alignment, evidence submission, human assessment and continuous improvement.',
  alternates: {
    canonical: '/accreditation',
  },
};

const stages = [
  {
    number: '01',
    title: 'Align with the SDGs',
    description:
      'Identify relevant Sustainable Development Goals, targets and indicators for your activities, programmes or organization.',
  },
  {
    number: '02',
    title: 'Collect and submit evidence',
    description:
      'Organize supporting documents, measurements and other evidence that explain the outcomes of your work.',
  },
  {
    number: '03',
    title: 'Review and validate',
    description:
      'A human-led assessment process can examine submitted evidence, identify gaps and document findings. AI may assist with analysis, but never makes the final decision.',
  },
  {
    number: '04',
    title: 'Improve and track progress',
    description:
      'Use assessment feedback to address gaps, strengthen evidence and improve how impact is measured and reported.',
  },
] as const;

export default function AccreditationPage() {
  return (
    <>
      <PageHero
        eyebrow="Assessment and recognition"
        title="A clearer journey from SDG alignment to verified impact"
        intro="ImpactAlign is being developed to help organizations connect their sustainability work to SDG targets, organize evidence and support a transparent, human-led assessment process."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Accreditation' }]}
      />

      <Container className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-700">
            The accreditation journey
          </p>

          <h2 className="mt-3 font-serif text-3xl font-bold text-navy-900 md:text-4xl">
            Four stages toward stronger impact evidence
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            The following describes the intended approach. Availability of assessment services,
            accreditation decisions and formal recognition depends on the platform&apos;s
            implementation and any applicable independent assessment arrangements.
          </p>
        </div>

        <ol className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          {stages.map((stage) => (
            <li
              key={stage.number}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="text-sm font-bold tracking-widest text-gold-700">
                STAGE {stage.number}
              </span>

              <h3 className="mt-3 font-serif text-xl font-bold text-navy-900">{stage.title}</h3>

              <p className="mt-3 leading-7 text-slate-600">{stage.description}</p>
            </li>
          ))}
        </ol>

        <section className="mx-auto mt-12 max-w-3xl rounded-xl border border-slate-200 p-6 md:p-8">
          <h2 className="font-serif text-2xl font-bold text-navy-900">
            Human decisions. Responsible AI.
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            AI-assisted tools may help organize information, summarize evidence and identify
            potential gaps. They do not replace qualified human judgment or independently award
            accreditation. Assessment criteria, reviewer responsibilities and decision records
            should be transparent.
          </p>
        </section>

        <p
          role="note"
          className="mx-auto mt-8 max-w-3xl rounded-md border border-gold-500 bg-gold-50 p-4 text-sm leading-6 text-navy-900"
        >
          Development status: This page describes the intended journey. It does not represent a
          guarantee of accreditation, certification or recognition by an external accreditation
          body.
        </p>
      </Container>

      <CtaBanner />
    </>
  );
}
