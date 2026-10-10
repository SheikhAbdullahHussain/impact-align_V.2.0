/** Standard error envelope returned by every API error response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}
