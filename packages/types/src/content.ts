export const CONTENT_KINDS = ['FAQ', 'SECTION', 'LEGAL', 'PLANS'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** A string is one paragraph; an array of strings is a bullet list. */
export type FaqBlockDto = string | string[];

export interface FaqItemDto {
  number: number;
  question: string;
  answer: FaqBlockDto[];
}

export interface FaqGroupDto {
  id: string;
  title: string;
  items: FaqItemDto[];
}

export interface FaqContentDto {
  groups: FaqGroupDto[];
}

export interface FaqEntryDto {
  key: string;
  status: ContentStatus;
  data: FaqContentDto;
  updatedAt: string;
  publishedAt: string | null;
}

/** Plain text only. Body: "## Heading", "- bullet", blank line between paragraphs. */
export interface LegalContentDto {
  title: string;
  body: string;
}

export interface SectionTopicDto {
  title: string;
  description: string;
  body: string[];
}
export interface SectionContentDto {
  title: string;
  eyebrow: string;
  intro: string;
  topics: SectionTopicDto[];
}

export interface PlanDto {
  name: string;
  priceText: string;
  description: string;
  features: string[];
  ctaLabel: string | null;
  ctaHref: string | null;
}
export interface PlansContentDto {
  title: string;
  intro: string;
  plans: PlanDto[];
}

export interface ContentEntryDto {
  kind: ContentKind;
  key: string;
  status: ContentStatus;
  data: unknown;
  updatedAt: string;
  publishedAt: string | null;
}
export interface ContentListItemDto {
  kind: ContentKind;
  key: string;
  status: ContentStatus;
  updatedAt: string;
}

/** The pages that can be edited from the admin panel. Anything else is refused. */
export const CONTENT_KEYS: Readonly<
  Record<ContentKind, readonly { key: string; label: string }[]>
> = {
  FAQ: [{ key: 'accreditation', label: 'Accreditation FAQ' }],
  SECTION: [
    { key: 'about', label: 'About' },
    { key: 'sdgs', label: 'SDGs' },
    { key: 'how-it-works', label: 'How it works' },
    { key: 'platform', label: 'Platform' },
    { key: 'resources', label: 'Resources' },
    { key: 'community', label: 'Community' },
    { key: 'join-impactalign', label: 'Join ImpactAlign' },
  ],
  LEGAL: [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms of Service' },
    { key: 'cookies', label: 'Cookie Policy' },
    { key: 'ai-ethics', label: 'AI Ethics' },
    { key: 'data-protection', label: 'Data Protection' },
    { key: 'accessibility', label: 'Accessibility Statement' },
    { key: 'security', label: 'Security' },
    { key: 'acceptable-use', label: 'Acceptable Use Policy' },
    { key: 'disclaimer', label: 'Disclaimer' },
  ],
  PLANS: [
    { key: 'membership', label: 'Membership' },
    { key: 'subscription', label: 'Subscription' },
  ],
};
