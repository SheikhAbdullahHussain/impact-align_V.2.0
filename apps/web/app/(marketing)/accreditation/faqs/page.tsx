import type { Metadata } from 'next';
import { Container } from '@impactalign/ui';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { FaqList } from '@/components/marketing/faq-list';
import { PageHero } from '@/components/marketing/page-hero';
import { faqGroups } from '@/lib/faq-content';

export const metadata: Metadata = {
  title: 'Accreditation FAQs',
  description:
    'Answers to frequently asked questions about ImpactAlign SDG accreditation: eligibility, evidence, assessment, the role of AI, decisions, certificates, fees and data handling.',
  alternates: {
    canonical: '/accreditation/faqs',
  },
};

export default function AccreditationFaqsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accreditation"
        title="Frequently asked questions"
        intro="Eligibility, evidence, assessment, the role of AI, decisions, certificates, fees and data handling."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Accreditation', href: '/accreditation' },
          { label: 'FAQs' },
        ]}
      />
      <Container className="max-w-4xl py-12 md:py-16">
        <FaqList groups={faqGroups} />
        <p
          role="note"
          className="mt-12 rounded-md border border-gold-500 bg-gold-50 p-4 text-sm leading-6 text-navy-900"
        >
          Development status: These answers describe the intended accreditation process. They do not
          represent a guarantee of accreditation, certification or recognition by an external
          accreditation body.
        </p>
      </Container>
      <CtaBanner />
    </>
  );
}