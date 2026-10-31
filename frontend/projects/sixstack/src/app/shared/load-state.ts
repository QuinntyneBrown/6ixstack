import { ApiError } from 'api';

/**
 * The state of one region's data (site/status-pages, L2-077): the region shows a skeleton while loading, its
 * content when loaded, and an inline failure with Try again when failed, while the page frame and filters stay.
 */
export type LoadState<T> =
  | { status: 'loading'; data: T | null }
  | { status: 'loaded'; data: T }
  | { status: 'failed'; data: T | null; error: ApiError | unknown };

export const loading = <T>(data: T | null = null): LoadState<T> => ({ status: 'loading', data });
export const loaded = <T>(data: T): LoadState<T> => ({ status: 'loaded', data });
export const failed = <T>(error: unknown, data: T | null = null): LoadState<T> => ({
  status: 'failed',
  data,
  error,
});

/** Skeletons appear only when a load is still pending after this long (browse-events design). */
export const SKELETON_DELAY_MS = 300;
