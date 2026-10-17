export const siteConfig = {
  name: 'ImpactAlign SDG',
  shortName: 'ImpactAlign',
  tagline: 'Diagnose → Align → Measure → Validate → Improve',
  description:
    'ImpactAlign SDG connects activities and evidence to SDG goals, targets and indicators, with human-validated impact assessment.',
  primaryCta: { label: 'JOIN IMPACTALIGN', href: '/join-impactalign' },
} as const;

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

/** Core public navigation — order is part of the brand contract. */
export const publicNav: readonly NavItem[] = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT', href: '/about' },
  { label: 'SDGs', href: '/sdgs' },
  { label: 'HOW IT WORKS', href: '/how-it-works' },
  { label: 'PLATFORM', href: '/platform' },
  { label: 'RESOURCES', href: '/resources' },
  { label: 'COMMUNITY', href: '/community' },
  { label: 'ACCREDITATION', href: '/accreditation' },
];

export const loginNav: NavItem = { label: 'LOGIN', href: '/login' };
export const joinNav: NavItem = {
  label: siteConfig.primaryCta.label,
  href: siteConfig.primaryCta.href,
};

export interface LegalPage {
  readonly slug: string;
  readonly title: string;
}

/** Legal pages are placeholders until reviewed by qualified counsel. */
export const legalPages: readonly LegalPage[] = [
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'cookies', title: 'Cookie Policy' },
  { slug: 'ai-ethics', title: 'AI Ethics' },
  { slug: 'data-protection', title: 'Data Protection' },
  { slug: 'accessibility', title: 'Accessibility Statement' },
  { slug: 'security', title: 'Security' },
  { slug: 'acceptable-use', title: 'Acceptable Use Policy' },
  { slug: 'disclaimer', title: 'Disclaimer' },
];

/** Authenticated dashboard navigation (routes are a UI preview until authentication exists). */
export const dashboardNav: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Profile', href: '/dashboard/profile' },
  { label: 'My Organization', href: '/dashboard/organization' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'New Upload', href: '/dashboard/uploads/new' },
  { label: 'Drafts', href: '/dashboard/drafts' },
  { label: 'My Submissions', href: '/dashboard/submissions' },
  { label: 'My Assessments', href: '/dashboard/assessments' },
  { label: 'My Accreditation', href: '/dashboard/accreditation' },
  { label: 'My Reports', href: '/dashboard/reports' },
  { label: 'My Certificates', href: '/dashboard/certificates' },
  { label: 'Membership', href: '/dashboard/membership' },
  { label: 'Subscription', href: '/dashboard/subscription' },
  { label: 'Notifications', href: '/dashboard/notifications' },
  { label: 'Settings', href: '/dashboard/settings' },
];
