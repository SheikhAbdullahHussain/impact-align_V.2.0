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

export interface ProjectDto {
  id: string;
  title: string;
  summary: string;
  /** SDG numbers 1-17 this project claims alignment with. */
  sdgNumbers: number[];
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