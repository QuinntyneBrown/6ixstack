/** What went wrong with an API call, without any server text (L2-077): only status, field errors and reference. */
export type ApiErrorKind =
  'Network' | 'NotFound' | 'Forbidden' | 'RateLimited' | 'Validation' | 'Server' | 'Other';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> = {},
    readonly referenceCode: string | null = null,
    readonly extensions: Record<string, unknown> = {},
  ) {
    super(`API request failed: ${kind}`);
  }
}
