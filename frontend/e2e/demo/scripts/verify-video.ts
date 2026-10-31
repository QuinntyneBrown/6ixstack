/**
 * Checks a demo video: one H.264 video stream at 1280 × 720 and one AAC audio stream, the expected duration,
 * integrated loudness from ffmpeg's ebur128 filter, and three frames (10 %, 50 %, 90 %) extracted for a look.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { demoPaths } from './paths';

export interface VerifyResult {
  ok: boolean;
  duration: number;
  loudness: number;
  truePeak: number;
  streams: string[];
  frames: string[];
  problems: string[];
}

export function verifyVideo(journey: string, expectedDuration?: number): VerifyResult {
  const paths = demoPaths(journey);
  const probe = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', paths.video], {
      encoding: 'utf8',
    }),
  ) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number }[];
    format: { duration: string };
  };
  const problems: string[] = [];
  const video = probe.streams.filter((s) => s.codec_type === 'video');
  const audio = probe.streams.filter((s) => s.codec_type === 'audio');
  const subtitles = probe.streams.filter((s) => s.codec_type === 'subtitle');
  if (video.length !== 1 || video[0].codec_name !== 'h264') problems.push('expected one H.264 video stream');
  if (video[0] && (video[0].width !== 1280 || video[0].height !== 720)) problems.push('expected 1280 × 720');
  if (audio.length !== 1 || audio[0].codec_name !== 'aac') problems.push('expected one AAC audio stream');
  if (subtitles.length) problems.push('the file carries a subtitle stream');
  const duration = Number(probe.format.duration);
  if (expectedDuration && Math.abs(duration - expectedDuration) > 1) {
    problems.push(`duration ${duration.toFixed(1)} s, expected about ${expectedDuration.toFixed(1)} s`);
  }

  const log = execFileSync(
    'sh',
    [
      '-c',
      `ffmpeg -hide_banner -nostats -i "${paths.video}" -filter_complex ebur128=peak=true -f null - 2>&1 | tail -15`,
    ],
    { encoding: 'utf8' },
  );
  const loudness = Number(/I:\s+(-?[\d.]+) LUFS/.exec(log)?.[1] ?? NaN);
  const truePeak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(log)?.[1] ?? NaN);
  if (!(loudness >= -19 && loudness <= -13))
    problems.push(`integrated loudness ${loudness} LUFS is outside -19 to -13`);
  if (truePeak > -0.5) problems.push(`true peak ${truePeak} dBFS is above -0.5`);

  mkdirSync(paths.frames, { recursive: true });
  const frames = [0.1, 0.5, 0.9].map((fraction) => {
    const file = resolve(paths.frames, `frame-${Math.round(fraction * 100)}.png`);
    execFileSync('ffmpeg', [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      (duration * fraction).toFixed(2),
      '-i',
      paths.video,
      '-frames:v',
      '1',
      file,
    ]);
    return file;
  });

  const result = {
    ok: problems.length === 0,
    duration,
    loudness,
    truePeak,
    streams: probe.streams.map((s) => `${s.codec_type}:${s.codec_name}`),
    frames,
    problems,
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
