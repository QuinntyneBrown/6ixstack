import { resolve } from 'node:path';

export const FRONTEND = resolve(__dirname, '../../..');
export const REPO = resolve(FRONTEND, '..');
export const DEMO_TOOLS = resolve(__dirname, '..');

/** Everything a journey's demo produces lives in docs/demos/<nn>-<slug>/. */
export function demoPaths(journey: string) {
  const dir = resolve(REPO, 'docs/demos', journey);
  const cache = resolve(DEMO_TOOLS, '.cache', journey);
  return {
    dir,
    screenshots: resolve(dir, 'screenshots'),
    narration: resolve(dir, 'narration.md'),
    video: resolve(dir, 'demo.mp4'),
    credits: resolve(dir, 'credits.md'),
    cache,
    audio: resolve(cache, 'audio'),
    frames: resolve(cache, 'frames'),
  };
}
