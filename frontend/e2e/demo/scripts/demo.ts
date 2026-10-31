/**
 * Records a journey's narrated demo video into docs/demos/<nn>-<slug>/:
 *   npm run demo -- 00-scaffold                    record, narrate, build and verify
 *   npm run demo -- 00-scaffold --skip-record      reuse the screenshots
 *   npm run demo -- 00-scaffold --captions         burn the narration in as captions (off by default)
 * Steps: run journeys/<id>.ts (screenshots) → Kokoro TTS of narration.md → ffmpeg build → verify.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildVideo, CROSSFADE_S, HOLD_EXTRA_S } from './build-video';
import { demoPaths, DEMO_TOOLS } from './paths';
import { runJourney } from './run-journey';
import { verifyVideo } from './verify-video';

async function main() {
  const journey = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!journey) {
    throw new Error('Usage: npm run demo -- <nn>-<slug> [--skip-record] [--captions] [--voice af_heart]');
  }
  const flag = (name: string) => process.argv.includes(`--${name}`);
  const voiceIndex = process.argv.indexOf('--voice');
  const voice = voiceIndex > -1 ? process.argv[voiceIndex + 1] : 'af_heart';
  const paths = demoPaths(journey);

  if (!flag('skip-record')) {
    console.log(`Recording ${journey}…`);
    await runJourney(journey);
  }
  if (!existsSync(paths.narration)) {
    throw new Error(
      `Write ${paths.narration} with one "## <screenshot-name>" section per screenshot, then rerun.`,
    );
  }

  console.log('Synthesising narration with Kokoro-82M…');
  const python = resolve(DEMO_TOOLS, '.venv/bin/python');
  if (!existsSync(python)) {
    throw new Error('Set up Kokoro first: see frontend/e2e/demo/README.md.');
  }
  execFileSync(
    python,
    [resolve(DEMO_TOOLS, 'scripts/tts.py'), paths.narration, paths.audio, '--voice', voice],
    {
      stdio: 'inherit',
    },
  );

  console.log('Building the video…');
  buildVideo(journey, { captions: flag('captions') });

  const durations = Object.values(
    JSON.parse(readFileSync(resolve(paths.audio, 'durations.json'), 'utf8')) as Record<string, number>,
  );
  const expected = durations.reduce((t, d) => t + d + HOLD_EXTRA_S, 0) + CROSSFADE_S;
  const result = verifyVideo(journey, expected);
  if (!result.ok) {
    throw new Error(`Verification failed: ${result.problems.join('; ')}`);
  }
  console.log(`Done. Look at the frames in ${paths.frames} to confirm there is no caption text.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
