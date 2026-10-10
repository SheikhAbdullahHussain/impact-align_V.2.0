import type { TitledItem } from './home-content';

export interface SectionContent {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly intro: string;
  /** Planned topics for the section (names follow the public site map). */
  readonly topics: readonly TitledItem[];
}

const soon = 'Content for this topic is being prepared.';
const t = (title: string, description = soon): TitledItem => ({ title, description });

export const sections: readonly SectionContent[] = [
  {
    slug: 'about',
    title: 'About ImpactAlign',
    eyebrow: 'About',
    intro:
      'ImpactAlign SDG helps people and organizations connect what they do to the Sustainable Development Goals — and have it reviewed by humans.',
    topics: [
      t('About ImpactAlign'),
      t('Vision & Mission'),
      t('Our Approach'),
      t('Governance'),
      t('Methodology', 'Diagnose, Align, Measure, Validate, Improve.'),
      t('AI & Ethics', 'AI assists; humans decide. See the AI Ethics page.'),
      t('Quality Assurance'),
      t('Partners & Collaborations'),
    ],
  },
  {
    slug: 'sdgs',
    title: 'SDGs',
    eyebrow: 'Sustainable Development Goals',
    intro:
      'Explore the 17 Sustainable Development Goals with their targets and indicators. The interactive explorer arrives in a later phase and will load official data from the platform.',
    topics: [
      t('United Nations SDGs'),
      t('SDG Goals'),
      t('SDG Targets'),
      t('SDG Indicators'),
      t('SDG Framework'),
      t('SDG Alignment'),
      t('SDG Knowledge Hub'),
      t('SDG Resources'),
    ],
  },
  {
    slug: 'how-it-works',
    title: 'How it works',
    eyebrow: 'Methodology',
    intro:
      'A five-step cycle — Diagnose, Align, Measure, Validate, Improve — supported by evidence.',
    topics: [
      t('What is ImpactAlign?'),
      t('Diagnose', 'Understand current activities, gaps and priorities.'),
      t('Align', 'Map activities to goals, targets and indicators.'),
      t('Measure', 'Collect evidence and indicator data.'),
      t('Validate', 'Human assessor review.'),
      t('Improve', 'Act on findings and iterate.'),
      t('Evidence & Documentation'),
      t('Impact Dashboard'),
      t('Accreditation Process'),
    ],
  },
  {
    slug: 'platform',
    title: 'Platform',
    eyebrow: 'Platform',
    intro: 'The tools that will support alignment, evidence, assessment and accreditation.',
    topics: [
      t('Alignment mapping'),
      t('Evidence management'),
      t('Assessment workflow'),
      t('Impact dashboard'),
      t('Accreditation journey'),
      t('Reports & certificates'),
    ],
  },
  {
    slug: 'resources',
    title: 'Resources',
    eyebrow: 'Knowledge hub',
    intro: 'Guides, handbooks, templates and publications to support your alignment work.',
    topics: [
      t('ImpactAlign Knowledge Hub'),
      t('SDG Resources'),
      t('Research & Publications'),
      t('Guidelines & Manuals'),
      t('Indicator Handbook'),
      t('Templates & Tools'),
      t('Reports'),
      t('FAQs'),
      t('Glossary'),
    ],
  },
  {
    slug: 'community',
    title: 'Community',
    eyebrow: 'Community',
    intro:
      'A network of members, institutions, practitioners and partners working toward the goals.',
    topics: [
      t('ImpactAlign Community'),
      t('Members'),
      t('Institutions'),
      t('Organizations'),
      t('Researchers'),
      t('Practitioners'),
      t('Partners'),
      t('Events & Webinars'),
      t('Community Stories'),
      t('Collaboration'),
    ],
  },
  {
    slug: 'join-impactalign',
    title: 'Join ImpactAlign',
    eyebrow: 'Get involved',
    intro:
      'Membership, subscription and accreditation options will be available here. Sign-up is not open yet.',
    topics: [
      t('Membership', 'Join the ImpactAlign community.'),
      t('Subscription', 'Plans and billing will be described here.'),
      t('Accreditation', 'How validation and accreditation will work.'),
    ],
  },
  {
    slug: 'login',
    title: 'Login',
    eyebrow: 'Account',
    intro: 'Sign-in is not available yet. Accounts are introduced in a later phase.',
    topics: [],
  },
];

export function getSection(slug: string): SectionContent {
  const section = sections.find((s) => s.slug === slug);
  if (!section) throw new Error(`Unknown section: ${slug}`);
  return section;
}
