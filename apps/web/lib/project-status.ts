import type { ProjectStatus } from '@impactalign/types';

export const STATUS_LABELS: Readonly<Record<ProjectStatus, string>> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CLARIFICATION_REQUIRED: 'Clarification required',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};