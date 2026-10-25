export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Standard error envelope returned by every API error response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    /** Field-level problems for validation errors (paths and messages only, never values). */
    details?: ApiErrorDetail[];
  };
}
