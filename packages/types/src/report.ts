export const REPORT_DECISIONS = ['VERIFIED', 'REJECTED'] as const;
export type ReportDecision = (typeof REPORT_DECISIONS)[number];

export interface ReportSdgItemDto {
  code: string;
  title: string | null;
}

export interface ReportEvidenceItemDto {
  fileName: string;
  sha256: string;
  sizeBytes: number;
  indicatorCode: string | null;
}

export interface AssessmentReportDto {
  id: string;
  projectId: string;
  code: string;
  title: string;
  submissionType: string;
  sdgNumbers: number[];
  targets: ReportSdgItemDto[];
  indicators: ReportSdgItemDto[];
  evidence: ReportEvidenceItemDto[];
  decision: ReportDecision;
  rationale: string;
  decidedAt: string;
  createdAt: string;
}
