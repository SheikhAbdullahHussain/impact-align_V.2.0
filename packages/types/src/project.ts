export const PROJECT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CLARIFICATION_REQUIRED',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const SUBMISSION_TYPES = [
  'PROJECT_PROPOSAL',
  'STARTUP_INNOVATION',
  'RESEARCH_MANUSCRIPT',
  'RESEARCH_PROPOSAL',
  'THESIS_DISSERTATION',
  'ORGANIZATIONAL_REPORT',
  'INSTITUTIONAL_REPORT',
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const SUBMISSION_TYPE_LABELS: Readonly<Record<SubmissionType, string>> = {
  PROJECT_PROPOSAL: 'Project Proposal',
  STARTUP_INNOVATION: 'Startup / Innovation',
  RESEARCH_MANUSCRIPT: 'Research Manuscript',
  RESEARCH_PROPOSAL: 'Research Proposal',
  THESIS_DISSERTATION: 'Research Thesis / Dissertation',
  ORGANIZATIONAL_REPORT: 'Organizational Report',
  INSTITUTIONAL_REPORT: 'Institutional Report',
};

export interface ProjectDto {
  id: string;
  title: string;
  summary: string;
  /** SDG numbers 1-17 this project claims alignment with. */
  sdgNumbers: number[];
  submissionType: SubmissionType;
  organizationId: string | null;
  /** IASDG-XXXXXX, issued at first submission. Null while it is still a draft. */
  code: string | null;
  /** SDG targets and indicators (catalogue ids) this project is mapped to. */
  targetIds: string[];
  indicatorIds: string[];
  status: ProjectStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Statuses in which the owner may still change the project and its evidence. */
export const EDITABLE_PROJECT_STATUSES: readonly ProjectStatus[] = [
  'DRAFT',
  'CLARIFICATION_REQUIRED',
];
