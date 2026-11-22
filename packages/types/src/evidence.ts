export interface EvidenceDto {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  /** The mapped SDG indicator this file supports, if any. */
  indicatorId: string | null;
  createdAt: string;
}
