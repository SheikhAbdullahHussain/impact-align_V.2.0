/** Error returned by the API (or a network failure, status 0). Messages are safe to show to users. */
export class ApiError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details = []) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
/** Kept in memory only (never localStorage): sent as X-CSRF-Token on state-changing requests. */
let csrfToken = null;
export const setCsrfToken = (token) => {
    csrfToken = token;
};
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export async function apiFetch(path, init = {}) {
    const method = init.method ?? 'GET';
    const headers = { Accept: 'application/json' };
    if (init.body !== undefined)
        headers['Content-Type'] = 'application/json';
    if (UNSAFE_METHODS.has(method) && csrfToken)
        headers['X-CSRF-Token'] = csrfToken;
    let response;
    try {
        response = await fetch(`/api/v1${path}`, {
            method,
            headers,
            credentials: 'same-origin',
            ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
        });
    }
    catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
    }
    if (response.status === 204)
        return undefined;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const error = data?.error;
        throw new ApiError(response.status, error?.code ?? 'UNKNOWN', error?.message ?? 'Something went wrong', error?.details);
    }
    return data;
}
export const authApi = {
    register: (body) => apiFetch('/auth/register', { method: 'POST', body }),
    verifyEmail: (token) => apiFetch('/auth/verify-email', { method: 'POST', body: { token } }),
    async login(email, password) {
        const result = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        setCsrfToken(result.csrfToken);
        return result;
    },
    async me() {
        const result = await apiFetch('/auth/me');
        setCsrfToken(result.csrfToken);
        return result;
    },
    async logout() {
        await apiFetch('/auth/logout', { method: 'POST', body: {} });
        setCsrfToken(null);
    },
    updateProfile: (displayName) => apiFetch('/users/me', {
        method: 'PATCH',
        body: { displayName },
    }),
    forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (token, password) => apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
    }),
};
export const projectsApi = {
    list: () => apiFetch('/projects'),
    create: (body) => apiFetch('/projects', { method: 'POST', body }),
    remove: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    get: (id) => apiFetch(`/projects/${id}`),
    update: (id, body) => apiFetch(`/projects/${id}`, { method: 'PUT', body }),
    submit: (id) => apiFetch(`/projects/${id}/submit`, { method: 'POST', body: {} }),
    withdraw: (id) => apiFetch(`/projects/${id}/withdraw`, { method: 'POST', body: {} }),
    feedback: (id) => apiFetch(`/projects/${id}/feedback`),
};
/** Uploads one file as the raw request body (the API reads the name from X-File-Name). */
export async function apiUpload(path, file) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
    };
    if (csrfToken)
        headers['X-CSRF-Token'] = csrfToken;
    let response;
    try {
        response = await fetch(`/api/v1${path}`, {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            body: file,
        });
    }
    catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const error = data?.error;
        throw new ApiError(response.status, error?.code ?? 'UNKNOWN', error?.message ?? 'Something went wrong', error?.details);
    }
    return data;
}
export const evidenceApi = {
    list: (projectId) => apiFetch(`/projects/${projectId}/evidence`),
    upload: (projectId, file) => apiUpload(`/projects/${projectId}/evidence`, file),
    remove: (projectId, evidenceId) => apiFetch(`/projects/${projectId}/evidence/${evidenceId}`, { method: 'DELETE' }),
    fileUrl: (projectId, evidenceId) => `/api/v1/projects/${projectId}/evidence/${evidenceId}/file`,
};
export const assessmentsApi = {
    queue: () => apiFetch('/assessments/queue'),
    get: (projectId) => apiFetch(`/assessments/${projectId}`),
    start: (projectId) => apiFetch(`/assessments/${projectId}/start`, {
        method: 'POST',
        body: {},
    }),
    requestClarification: (projectId, message) => apiFetch(`/assessments/${projectId}/clarification`, {
        method: 'POST',
        body: { message },
    }),
    decide: (projectId, body) => apiFetch(`/assessments/${projectId}/decision`, {
        method: 'POST',
        body,
    }),
    fileUrl: (projectId, evidenceId) => `/api/v1/assessments/${projectId}/evidence/${evidenceId}/file`,
};
/** Turns any error into a friendly sentence. Never shows raw server details. */
export function describeError(error) {
    if (!(error instanceof ApiError))
        return 'Something went wrong. Please try again.';
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
// The package is shared by both Next.js applications; keep request semantics in one place.
//# sourceMappingURL=index.js.map