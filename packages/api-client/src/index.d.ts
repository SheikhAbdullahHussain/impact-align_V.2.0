import type { PublicUser, ApiErrorDetail, AuthResponse, ProjectDto, EvidenceDto, AssessmentDetailDto, AssessmentQueueItemDto, ReviewNoteDto } from '@impactalign/types';
/** Error returned by the API (or a network failure, status 0). Messages are safe to show to users. */
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details: ApiErrorDetail[];
    constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]);
}
export declare const setCsrfToken: (token: string | null) => void;
export declare function apiFetch<T>(path: string, init?: {
    method?: string;
    body?: unknown;
}): Promise<T>;
export interface RegisterBody {
    email: string;
    password: string;
    displayName: string;
    accountType: string;
}
export declare const authApi: {
    register: (body: RegisterBody) => Promise<{
        message: string;
    }>;
    verifyEmail: (token: string) => Promise<{
        message: string;
    }>;
    login(email: string, password: string): Promise<AuthResponse>;
    me(): Promise<AuthResponse>;
    logout(): Promise<void>;
    updateProfile: (displayName: string) => Promise<{
        user: PublicUser;
    }>;
    forgotPassword: (email: string) => Promise<{
        message: string;
    }>;
    resetPassword: (token: string, password: string) => Promise<{
        message: string;
    }>;
};
export interface ProjectBody {
    title: string;
    summary: string;
    sdgNumbers: number[];
}
export declare const projectsApi: {
    list: () => Promise<{
        projects: ProjectDto[];
    }>;
    create: (body: ProjectBody) => Promise<{
        project: ProjectDto;
    }>;
    remove: (id: string) => Promise<void>;
    get: (id: string) => Promise<{
        project: ProjectDto;
    }>;
    update: (id: string, body: ProjectBody) => Promise<{
        project: ProjectDto;
    }>;
    submit: (id: string) => Promise<{
        project: ProjectDto;
    }>;
    withdraw: (id: string) => Promise<{
        project: ProjectDto;
    }>;
    feedback: (id: string) => Promise<{
        notes: ReviewNoteDto[];
    }>;
};
/** Uploads one file as the raw request body (the API reads the name from X-File-Name). */
export declare function apiUpload<T>(path: string, file: File): Promise<T>;
export declare const evidenceApi: {
    list: (projectId: string) => Promise<{
        evidence: EvidenceDto[];
    }>;
    upload: (projectId: string, file: File) => Promise<{
        evidence: EvidenceDto;
    }>;
    remove: (projectId: string, evidenceId: string) => Promise<void>;
    fileUrl: (projectId: string, evidenceId: string) => string;
};
export interface DecisionBody {
    decision: 'VERIFIED' | 'REJECTED';
    rationale: string;
}
export declare const assessmentsApi: {
    queue: () => Promise<{
        queue: AssessmentQueueItemDto[];
    }>;
    get: (projectId: string) => Promise<{
        assessment: AssessmentDetailDto;
    }>;
    start: (projectId: string) => Promise<{
        project: ProjectDto;
    }>;
    requestClarification: (projectId: string, message: string) => Promise<{
        project: ProjectDto;
    }>;
    decide: (projectId: string, body: DecisionBody) => Promise<{
        project: ProjectDto;
    }>;
    fileUrl: (projectId: string, evidenceId: string) => string;
};
/** Turns any error into a friendly sentence. Never shows raw server details. */
export declare function describeError(error: unknown): string;
//# sourceMappingURL=index.d.ts.map