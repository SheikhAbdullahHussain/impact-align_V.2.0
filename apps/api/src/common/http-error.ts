import type { ApiErrorDetail } from '@impactalign/types';

/** Error that is safe to show to API clients (message is public). */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[] | undefined;

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(message = 'Resource not found'): HttpError {
    return new HttpError(404, 'NOT_FOUND', message);
  }
}
