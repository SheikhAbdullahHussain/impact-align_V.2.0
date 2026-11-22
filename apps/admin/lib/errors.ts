import { describeError } from '@impactalign/api-client';

/** Shows the API's own message for validation problems (it says exactly what to fix). */
export function reason(cause: unknown): string {
  if (cause instanceof Error && (cause as { code?: string }).code === 'VALIDATION_ERROR') {
    return cause.message;
  }
  return describeError(cause);
}
