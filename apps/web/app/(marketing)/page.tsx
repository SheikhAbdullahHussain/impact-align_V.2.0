import type { Metadata } from 'next';
import { AiPanel } from '@/components/marketing/ai-panel';
import { CtaBanner } from '@/components/marketing/cta-banner';
import { DashboardPreview } from '@/components/marketing/dashboard-preview';
import { Hero } from '@/components/marketing/hero';
import { ItemGrid } from '@/components/marketing/item-grid';
import { Journey } from '@/components/marketing/journey';
import { LinkCards } from '@/components/marketing/link-cards';
import { MethodSteps } from '@/components/marketing/method-steps';
import { SdgPreviewGrid } from '@/components/marketing/sdg-preview-grid';
import { Section } from '@/components/marketing/section';
import { audiences, platformFeatures, valueProps } from '@/lib/home-content';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section
        id="value"
        eyebrow="Why ImpactAlign"
        title="From scattered activity to a clear, reviewable story"
        description="One place to connect what you do to the SDG framework, back it with evidence, and have it validated by people."
      >
        <ItemGrid items={valueProps} />
      </Section>

      <Section
        id="audience"
        tone="muted"
        eyebrow="Who it is for"
        title="Built for everyone doing the work — and those who review it"
      >
        <ItemGrid items={audiences} />
      </Section>

      <Section
        id="method"
        eyebrow="How it works"
        title="Diagnose → Align → Measure → Validate → Improve"
        description="A repeatable cycle that turns intentions into evidence-backed, human-validated impact."
      >
        <MethodSteps />
      </Section>

      <Section
        id="sdgs"
        tone="dark"
        eyebrow="SDG Explorer"
        title="Seventeen goals. Targets. Indicators."
        description="Explore how goals break down into targets and indicators, and where your work fits."
      >
        <SdgPreviewGrid />
      </Section>

      <Section
        id="platform"
        eyebrow="Platform"
        title="What the platform will offer"
        description="These capabilities are planned and are being built in phases."
      >
        <ItemGrid items={platformFeatures} />
      </Section>

      <Section
        id="ai"
        tone="muted"
        eyebrow="AI with human oversight"
        title="AI assists. People decide."
        description="ImpactAlign uses AI to help, never to replace the judgement of a qualified assessor."
      >
        <AiPanel />
      </Section>

      <Section
        id="dashboard"
        eyebrow="Impact dashboard"
        title="See your alignment at a glance"
        description="A preview of the planned dashboard layout. It does not show real data."
      >
        <DashboardPreview />
      </Section>

      <Section
        id="accreditation"
        tone="dark"
        eyebrow="Accreditation journey"
        title="From evidence to a human decision"
        description="An indicative journey. Criteria and process are defined as the platform is built."
      >
        <Journey />
      </Section>

      <Section id="explore" eyebrow="Community & resources" title="Learn, connect and collaborate">
        <LinkCards
          items={[
            {
              title: 'Community',
              description:
                'Members, institutions, practitioners and partners working toward the goals.',
              href: '/community',
            },
            {
              title: 'Resources',
              description: 'Guides, handbooks, templates and publications for your alignment work.',
              href: '/resources',
            },
          ]}
        />
      </Section>

      <CtaBanner />
    </>
  );
}
