/**
 * Builds docs/demos/<journey>/demo.mp4 from its screenshots and narration clips with ffmpeg: each screenshot is held
 * for its narration plus 0.6 s with a slow, gentle zoom, joined by 0.4 s crossfades; the voice is normalised to
 * about -16 LUFS; the music loops, fades in over 1 s and out over 2 s, and is ducked under the voice with sidechain
 * compression. H.264 + AAC at 1280 × 720, 30 fps. No captions unless `captions` is true.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { demoPaths, DEMO_TOOLS } from './paths';

export const HOLD_EXTRA_S = 0.6;
export const CROSSFADE_S = 0.4;
const FPS = 30;
const MUSIC = resolve(DEMO_TOOLS, 'music/port-of-spain-carnival-flow.mp3');

export interface BuildOptions {
  captions?: boolean;
  music?: string;
}

function srtTime(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

export function buildVideo(journey: string, options: BuildOptions = {}): string {
  const paths = demoPaths(journey);
  const durations = JSON.parse(readFileSync(resolve(paths.audio, 'durations.json'), 'utf8')) as Record<
    string,
    number
  >;
  const shots = readdirSync(paths.screenshots)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((file) => ({ file, name: file.replace(/\.png$/, '') }));
  const missing = shots.filter((s) => durations[s.name] === undefined).map((s) => s.name);
  if (missing.length) {
    throw new Error(`No narration for: ${missing.join(', ')}. Add a "## <name>" section to narration.md.`);
  }

  const clipLength = shots.map((s) => durations[s.name] + HOLD_EXTRA_S + CROSSFADE_S);
  const starts: number[] = [];
  clipLength.reduce((t, d, i) => {
    starts[i] = t;
    return t + d - CROSSFADE_S;
  }, 0);
  const total = starts[starts.length - 1] + clipLength[clipLength.length - 1];

  const inputs: string[] = [];
  const filters: string[] = [];
  shots.forEach((s, i) => {
    inputs.push(
      '-loop',
      '1',
      '-framerate',
      String(FPS),
      '-t',
      clipLength[i].toFixed(3),
      '-i',
      resolve(paths.screenshots, s.file),
    );
    const frames = Math.ceil(clipLength[i] * FPS);
    // Upscale first so the slow zoom stays smooth, then zoom from 1.00 to about 1.04 around the centre.
    filters.push(
      `[${i}:v]scale=2560:1440,zoompan=z='min(1+0.04*on/${frames},1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1280x720:fps=${FPS},trim=duration=${clipLength[i].toFixed(3)},setpts=PTS-STARTPTS,format=yuv420p[v${i}]`,
    );
  });
  let video = 'v0';
  for (let i = 1; i < shots.length; i++) {
    const out = `x${i}`;
    filters.push(
      `[${video}][v${i}]xfade=transition=fade:duration=${CROSSFADE_S}:offset=${starts[i].toFixed(3)}[${out}]`,
    );
    video = out;
  }
  if (options.captions) {
    const narration = readFileSync(paths.narration, 'utf8');
    const texts = Object.fromEntries(
      [...narration.matchAll(/^##\s+(.+?)\s*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/gm)].map((m) => [
        m[1].trim(),
        m[2].replace(/\s+/g, ' ').trim(),
      ]),
    );
    const srt = shots
      .map(
        (s, i) =>
          `${i + 1}\n${srtTime(starts[i] + 0.2)} --> ${srtTime(starts[i] + 0.2 + durations[s.name])}\n${texts[s.name]}\n`,
      )
      .join('\n');
    const srtPath = resolve(paths.cache, 'captions.srt');
    writeFileSync(srtPath, srt);
    filters.push(`[${video}]subtitles='${srtPath}'[vc]`);
    video = 'vc';
  }

  // Voice: each clip starts 0.2 s into its screenshot.
  const voiceInputs = shots.length;
  shots.forEach((s, i) => {
    inputs.push('-i', resolve(paths.audio, `${s.name}.wav`));
    const delay = Math.round((starts[i] + 0.2) * 1000);
    filters.push(
      `[${voiceInputs + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${delay}|${delay}[a${i}]`,
    );
  });
  filters.push(
    `${shots.map((_, i) => `[a${i}]`).join('')}amix=inputs=${shots.length}:normalize=0,apad,atrim=duration=${total.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11,asplit=2[voice][key]`,
  );
  // Music: looped, trimmed, faded, quiet, and ducked whenever the voice speaks.
  const musicInput = voiceInputs + shots.length;
  inputs.push('-stream_loop', '-1', '-i', options.music ?? MUSIC);
  filters.push(
    `[${musicInput}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=${total.toFixed(3)},volume=0.22,afade=t=in:st=0:d=1,afade=t=out:st=${(total - 2).toFixed(3)}:d=2[music]`,
    `[music][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked]`,
    `[voice][ducked]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.79:level=0[mix]`,
  );

  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      ...inputs,
      '-filter_complex',
      filters.join(';'),
      '-map',
      `[${video}]`,
      '-map',
      '[mix]',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-t',
      total.toFixed(3),
      '-movflags',
      '+faststart',
      paths.video,
    ],
    { stdio: 'inherit' },
  );
  console.log(
    `Built ${paths.video} (${total.toFixed(1)} s, ${shots.length} screenshots${options.captions ? ', captions' : ''})`,
  );
  return paths.video;
}
