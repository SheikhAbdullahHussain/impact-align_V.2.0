import type { Metadata } from 'next';
import { dashboardNav } from '@impactalign/config';

export interface DashboardPageContent {
  readonly description: string;
  readonly emptyTitle: string;
  /** What the page is planned to offer (no behaviour exists yet). */
  readonly capabilities: readonly string[];
}

/** Evidence workflow states (from the product spec). Shown as a legend, not as live data. */
export const evidenceStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CLARIFICATION_REQUIRED',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;

export const plannedFileTypes = [
  'PDF',
  'DOCX',
  'XLSX',
  'CSV',
  'Images',
  'Other approved formats',
] as const;

export const dashboardContent: Readonly<Record<string, DashboardPageContent>> = {
  '/dashboard/profile': {
    description: 'Your personal details and privacy preferences.',
    emptyTitle: 'Profile is not available yet',
    capabilities: ['Edit your profile', 'Manage privacy preferences', 'Export or delete your data'],
  },
  '/dashboard/organization': {
    description: 'Your organization, its members and their roles.',
    emptyTitle: 'No organization yet',
    capabilities: ['Create or join an organization', 'Invite members', 'Manage organization roles'],
  },
  '/dashboard/projects': {
    description: 'Projects and activities mapped to the SDG framework.',
    emptyTitle: 'No projects yet',
    capabilities: [
      'Create and edit projects',
      'Add activities',
      'Map SDGs, targets and indicators',
      'Attach evidence and submit the project',
    ],
  },
  '/dashboard/uploads/new': {
    description: 'Upload evidence against the indicators you address.',
    emptyTitle: 'Uploads are not available yet',
    capabilities: [
      'Validated uploads (type, extension and size checks)',
      'Private storage with access-controlled downloads',
      'Malware-scan integration and audit logging',
    ],
  },
  '/dashboard/drafts': {
    description: 'Work in progress that has not been submitted.',
    emptyTitle: 'No drafts yet',
    capabilities: ['Resume unfinished submissions', 'Save evidence as draft before submitting'],
  },
  '/dashboard/submissions': {
    description: 'Evidence and projects you have submitted, with their review status.',
    emptyTitle: 'No submissions yet',
    capabilities: ['Track the status of each submission', 'Respond to clarification requests'],
  },
  '/dashboard/assessments': {
    description: 'Assessments of your submissions by qualified human reviewers.',
    emptyTitle: 'No assessments yet',
    capabilities: ['See assessor feedback', 'View assessment status and outcomes'],
  },
  '/dashboard/accreditation': {
    description: 'Your accreditation progress. Decisions are made by humans, never by AI.',
    emptyTitle: 'No accreditation activity yet',
    capabilities: ['Follow your accreditation journey', 'See the decision and its rationale'],
  },
  '/dashboard/reports': {
    description: 'Reports about your alignment and impact.',
    emptyTitle: 'No reports yet',
    capabilities: ['Generate impact and alignment reports', 'Download reports'],
  },
  '/dashboard/certificates': {
    description: 'Certificates issued after human validation.',
    emptyTitle: 'No certificates yet',
    capabilities: ['View issued certificates', 'Share a public verification link'],
  },
  '/dashboard/membership': {
    description: 'Your ImpactAlign membership.',
    emptyTitle: 'Membership is not available yet',
    capabilities: ['View membership status', 'Manage membership details'],
  },
  '/dashboard/subscription': {
    description: 'Your subscription plan and billing.',
    emptyTitle: 'Subscriptions are not available yet',
    capabilities: ['View your plan', 'Manage billing and invoices'],
  },
  '/dashboard/notifications': {
    description: 'Updates about your submissions and assessments.',
    emptyTitle: 'No notifications',
    capabilities: ['Review status changes', 'Choose how you are notified'],
  },
  '/dashboard/settings': {
    description: 'Account, security and privacy settings.',
    emptyTitle: 'Settings are not available yet',
    capabilities: ['Change password and manage sessions', 'Set up multi-factor authentication'],
  },
};

export function getDashboardTitle(href: string): string {
  const item = dashboardNav.find((n) => n.href === href);
  if (!item) throw new Error(`Unknown dashboard route: ${href}`);
  return item.label;
}

export function getDashboardContent(href: string): DashboardPageContent {
  const content = dashboardContent[href];
  if (!content) throw new Error(`No dashboard content for: ${href}`);
  return content;
}

export function dashboardMetadata(href: string): Metadata {
  return { title: getDashboardTitle(href) };
}
