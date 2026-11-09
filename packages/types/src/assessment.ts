import type { EvidenceDto } from './evidence';
import type { ProjectDto } from './project';

export const REVIEW_NOTE_KINDS = [
  'CLARIFICATION_REQUEST',
  'DECISION_VERIFIED',
  'DECISION_REJECTED',
] as const;
export type ReviewNoteKind = (typeof REVIEW_NOTE_KINDS)[number];

export interface ReviewNoteDto {
  id: string;
  kind: ReviewNoteKind;
  message: string;
  createdAt: string;
}

export interface AssessmentQueueItemDto {
  project: ProjectDto;
  ownerName: string;
  assignedToMe: boolean;
}

export interface AssessmentDetailDto {
  project: ProjectDto;
  ownerName: string;
  evidence: EvidenceDto[];
  notes: ReviewNoteDto[];
  assignedToMe: boolean;
  /** True when the caller may give the final decision (ACCREDITATION_REVIEW). */
  canDecide: boolean;
}