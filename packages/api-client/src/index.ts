import type {
  PublicUser,
  ApiErrorBody,
  ApiErrorDetail,
  AuthResponse,
  ProjectDto,
  EvidenceDto,
  AssessmentDetailDto,
  AssessmentQueueItemDto,
  ReviewNoteDto,
  AssessmentReportDto,
  CertificateDto,
  PublicVerificationDto,
  FaqEntryDto,
  FaqContentDto,
  ContentStatus,
  ContentEntryDto,
  ContentListItemDto,
  PublicOrganization,
  SdgDto,
  SdgIndicatorDto,
  SdgTargetDto,
  SubmissionType,
} from '@impactalign/types';
/** Error returned by the API (or a network failure, status 0). Messages are safe to show to users. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Kept in memory only (never localStorage): sent as X-CSRF-Token on state-changing requests. */
let csrfToken: string | null = null;
export const setCsrfToken = (token: string | null): void => {
  csrfToken = token;
};

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (UNSAFE_METHODS.has(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Check your connection and try again.',
    );
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Something went wrong',
      error?.details,
    );
  }
  return data as T;
}

export interface RegisterBody {
  email: string;
  password: string;
  displayName: string;
  accountType: string;
}

export const authApi = {
  register: (body: RegisterBody) =>
    apiFetch<{ message: string }>('/auth/register', { method: 'POST', body }),
  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>('/auth/verify-email', { method: 'POST', body: { token } }),
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setCsrfToken(result.csrfToken);
    return result;
  },
  async me(): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/me');
    setCsrfToken(result.csrfToken);
    return result;
  },
  async logout(): Promise<void> {
    await apiFetch<void>('/auth/logout', { method: 'POST', body: {} });
    setCsrfToken(null);
  },
  updateProfile: (displayName: string) =>
    apiFetch<{ user: PublicUser }>('/users/me', {
      method: 'PATCH',
      body: { displayName },
    }),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),
};

export interface ProjectBody {
  submissionType?: SubmissionType | undefined;
  organizationId?: string | null | undefined;
  title: string;
  summary: string;
  sdgNumbers: number[];
}

export const projectsApi = {
  list: () => apiFetch<{ projects: ProjectDto[] }>('/projects'),
  create: (body: ProjectBody) =>
    apiFetch<{ project: ProjectDto }>('/projects', { method: 'POST', body }),
  remove: (id: string) => apiFetch<void>(`/projects/${id}`, { method: 'DELETE' }),
  get: (id: string) => apiFetch<{ project: ProjectDto }>(`/projects/${id}`),
  update: (id: string, body: ProjectBody) =>
    apiFetch<{ project: ProjectDto }>(`/projects/${id}`, { method: 'PUT', body }),
  submit: (id: string, declaration: boolean) =>
    apiFetch<{ project: ProjectDto }>(`/projects/${id}/submit`, {
      method: 'POST',
      body: { declaration },
    }),
  withdraw: (id: string) =>
    apiFetch<{ project: ProjectDto }>(`/projects/${id}/withdraw`, { method: 'POST', body: {} }),
  feedback: (id: string) => apiFetch<{ notes: ReviewNoteDto[] }>(`/projects/${id}/feedback`),
  setAlignment: (id: string, body: { targetIds: string[]; indicatorIds: string[] }) =>
    apiFetch<{ project: ProjectDto }>(`/projects/${id}/alignment`, { method: 'PUT', body }),
};

export const organizationsApi = {
  list: () => apiFetch<{ organizations: PublicOrganization[] }>('/organizations'),
};

/** Public, read-only SDG catalogue (goals, targets, indicators). */
export const sdgsApi = {
  list: () => apiFetch<{ data: SdgDto[] }>('/sdgs'),
  targets: (number: number) => apiFetch<{ data: SdgTargetDto[] }>(`/sdgs/${number}/targets`),
  indicators: (number: number) =>
    apiFetch<{ data: SdgIndicatorDto[] }>(`/sdgs/${number}/indicators`),
};

/** Uploads one file as the raw request body (the API reads the name from X-File-Name). */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': file.type || 'application/octet-stream',
    'X-File-Name': encodeURIComponent(file.name),
  };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: file,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Check your connection and try again.',
    );
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Something went wrong',
      error?.details,
    );
  }
  return data as T;
}

export const evidenceApi = {
  list: (projectId: string) =>
    apiFetch<{ evidence: EvidenceDto[] }>(`/projects/${projectId}/evidence`),
  upload: (projectId: string, file: File) =>
    apiUpload<{ evidence: EvidenceDto }>(`/projects/${projectId}/evidence`, file),
  remove: (projectId: string, evidenceId: string) =>
    apiFetch<void>(`/projects/${projectId}/evidence/${evidenceId}`, { method: 'DELETE' }),
  linkIndicator: (projectId: string, evidenceId: string, indicatorId: string | null) =>
    apiFetch<{ evidence: EvidenceDto }>(`/projects/${projectId}/evidence/${evidenceId}/indicator`, {
      method: 'PUT',
      body: { indicatorId },
    }),
  fileUrl: (projectId: string, evidenceId: string) =>
    `/api/v1/projects/${projectId}/evidence/${evidenceId}/file`,
};

export interface DecisionBody {
  decision: 'VERIFIED' | 'REJECTED';
  rationale: string;
}

export const assessmentsApi = {
  queue: () => apiFetch<{ queue: AssessmentQueueItemDto[] }>('/assessments/queue'),
  get: (projectId: string) =>
    apiFetch<{ assessment: AssessmentDetailDto }>(`/assessments/${projectId}`),
  start: (projectId: string) =>
    apiFetch<{ project: ProjectDto }>(`/assessments/${projectId}/start`, {
      method: 'POST',
      body: {},
    }),
  requestClarification: (projectId: string, message: string) =>
    apiFetch<{ project: ProjectDto }>(`/assessments/${projectId}/clarification`, {
      method: 'POST',
      body: { message },
    }),
  decide: (projectId: string, body: DecisionBody) =>
    apiFetch<{ project: ProjectDto }>(`/assessments/${projectId}/decision`, {
      method: 'POST',
      body,
    }),
  fileUrl: (projectId: string, evidenceId: string) =>
    `/api/v1/assessments/${projectId}/evidence/${evidenceId}/file`,
};

export const reportsApi = {
  list: () => apiFetch<{ reports: AssessmentReportDto[] }>('/reports'),
  get: (projectId: string) => apiFetch<{ report: AssessmentReportDto }>(`/reports/${projectId}`),
  downloadUrl: (projectId: string) => `/api/v1/reports/${projectId}/download`,
};

export const certificatesApi = {
  list: () => apiFetch<{ certificates: CertificateDto[] }>('/certificates'),
  get: (projectId: string) =>
    apiFetch<{ certificate: CertificateDto }>(`/certificates/${projectId}`),
  downloadUrl: (projectId: string) => `/api/v1/certificates/${projectId}/download`,
  /** ASSESSOR only. */
  lookup: (code: string) =>
    apiFetch<{ certificate: CertificateDto }>(`/certificates/lookup/${encodeURIComponent(code)}`),
  /** ASSESSOR only. The reason stays internal. */
  revoke: (projectId: string, reason: string) =>
    apiFetch<{ certificate: CertificateDto }>(`/certificates/${projectId}/revoke`, {
      method: 'POST',
      body: { reason },
    }),
};

/** Public, no login. */
export const verifyApi = {
  get: (code: string) =>
    apiFetch<{ verification: PublicVerificationDto }>(`/verify/${encodeURIComponent(code)}`),
};

/** Public, no login: published website content only. */
export const contentApi = {
  faq: (key: string) => apiFetch<{ entry: FaqEntryDto }>(`/content/faq/${encodeURIComponent(key)}`),
};

/** Staff only (ADMIN_ACCESS). */
export const adminContentApi = {
  getFaq: (key: string) =>
    apiFetch<{ entry: FaqEntryDto | null }>(`/admin/content/faq/${encodeURIComponent(key)}`),
  saveFaq: (key: string, body: { status: ContentStatus; data: FaqContentDto }) =>
    apiFetch<{ entry: FaqEntryDto }>(`/admin/content/faq/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body,
    }),
};

export type ContentKindParam = 'faq' | 'section' | 'legal' | 'plans';

/** Public, no login: published content of any kind. */
export const siteContentApi = {
  get: (kind: ContentKindParam, key: string) =>
    apiFetch<{ entry: ContentEntryDto }>(`/content/${kind}/${encodeURIComponent(key)}`),
};

/** Staff only (ADMIN_ACCESS). */
export const adminSiteContentApi = {
  list: () => apiFetch<{ items: ContentListItemDto[] }>('/admin/content'),
  get: (kind: ContentKindParam, key: string) =>
    apiFetch<{ entry: ContentEntryDto | null }>(
      `/admin/content/${kind}/${encodeURIComponent(key)}`,
    ),
  save: (kind: ContentKindParam, key: string, body: { status: ContentStatus; data: unknown }) =>
    apiFetch<{ entry: ContentEntryDto }>(`/admin/content/${kind}/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body,
    }),
};

/** Turns any error into a friendly sentence. Never shows raw server details. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Please verify your email first. Check your inbox for the verification link.';
    case 'TOO_MANY_ATTEMPTS':
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'INVALID_OR_EXPIRED_TOKEN':
      return 'This link is invalid or has expired. Please request a new one.';
    case 'VALIDATION_ERROR':
      return 'Please check the highlighted fields and try again.';
    default:
      return error.message;
  }
}
