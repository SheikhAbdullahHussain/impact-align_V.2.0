export const CERTIFICATE_STATUSES = ['VALID', 'EXPIRED', 'REVOKED'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface CertificateDto {
  id: string;
  projectId: string;
  certificateNumber: string;
  code: string;
  title: string;
  submissionType: string;
  sdgNumbers: number[];
  status: CertificateStatus;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

/** What the public verification page may show. No owner, reviewer, evidence or rationale. */
export interface PublicVerificationDto {
  code: string;
  certificateNumber: string;
  title: string;
  submissionType: string;
  sdgNumbers: number[];
  status: CertificateStatus;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
}
