#!/usr/bin/env python3
"""Synthesises one narration clip per screenshot with Kokoro-82M (hexgrad/Kokoro-82M), run locally.

Usage: .venv/bin/python scripts/tts.py <narration.md> <out-dir> [--voice af_heart] [--speed 1.0]

narration.md holds one `## <screenshot-name>` section per screenshot (name without .png) followed by the
paragraph to speak. Writes <out-dir>/<screenshot-name>.wav (24 kHz mono) and <out-dir>/durations.json.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

SAMPLE_RATE = 24_000


def sections(markdown: str) -> list[tuple[str, str]]:
    parts = re.split(r'^##\s+(.+?)\s*$', markdown, flags=re.M)
    out = []
    for i in range(1, len(parts), 2):
        text = ' '.join(line.strip() for line in parts[i + 1].strip().splitlines() if line.strip())
        if text:
            out.append((parts[i].strip(), text))
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('narration')
    parser.add_argument('out_dir')
    parser.add_argument('--voice', default='af_heart')
    parser.add_argument('--speed', type=float, default=1.0)
    args = parser.parse_args()

    items = sections(Path(args.narration).read_text(encoding='utf-8'))
    if not items:
        print('No "## <screenshot>" sections found in the narration.', file=sys.stderr)
        return 1

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
    durations = {}
    for name, text in items:
        chunks = [audio for _, _, audio in pipeline(text, voice=args.voice, speed=args.speed)]
        audio = np.concatenate([np.asarray(c, dtype=np.float32) for c in chunks])
        sf.write(out / f'{name}.wav', audio, SAMPLE_RATE)
        durations[name] = round(len(audio) / SAMPLE_RATE, 3)
        print(f'{name}: {durations[name]:.2f} s')
    (out / 'durations.json').write_text(json.dumps(durations, indent=2), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
