# Demo-video tooling

Builds a narrated MP4 for each journey from screenshots of the running app:

1. **Record** — `scripts/run-journey.ts` starts the API on a freshly seeded SQLite database (clock fixed at Monday,
   November 2, 2026) and `ng serve`, then runs `journeys/<nn>-<slug>.ts` in Chromium at 1280 × 720. Each
   `shot('beat')` saves `docs/demos/<nn>-<slug>/screenshots/NN-beat.png`. `shot('beat', { phone: true })` frames a
   phone-width view on a 1280 × 720 canvas.
2. **Narrate** — write `docs/demos/<nn>-<slug>/narration.md` with one `## NN-beat` section per screenshot.
   `scripts/tts.py` speaks each section with Kokoro-82M (`hexgrad/Kokoro-82M`, voice `af_heart`, normal speed),
   locally.
3. **Build** — `scripts/build-video.ts` holds each screenshot for its narration plus 0.6 s with a slow zoom, joins
   them with 0.4 s crossfades, normalises the voice to about −16 LUFS, loops the music, fades it in over 1 s and out
   over 2 s, and ducks it under the voice with sidechain compression. H.264 + AAC, 1280 × 720, 30 fps.
   **No captions** unless you pass `--captions`.
4. **Verify** — `scripts/verify-video.ts` checks with ffprobe for one video and one audio stream, 1280 × 720 and the
   expected duration, measures loudness with `ebur128` (−19 to −13 LUFS, true peak ≤ −0.5 dBFS) and extracts
   frames at 10 %, 50 % and 90 % into `.cache/<journey>/frames/` to look at.

## Setup

- ffmpeg and ffprobe with `zoompan`, `xfade`, `sidechaincompress`, `loudnorm` and `ebur128` (Homebrew `ffmpeg`).
- Python 3.10–3.12 and `espeak-ng` (Kokoro's fallback phonemiser).
- Kokoro, pinned in `requirements.txt`:

```bash
cd frontend/e2e/demo
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

The first run downloads the Kokoro-82M weights and the `af_heart` voice from Hugging Face into the local cache.

## Use

```bash
cd frontend
npm run demo -- 00-scaffold                 # record, narrate, build, verify
npm run demo -- 00-scaffold --skip-record   # reuse the screenshots (after editing the narration)
npm run demo -- 00-scaffold --captions      # burn captions in (off by default)
DEMO_BASE_URL=http://localhost:4200 npm run demo -- 00-scaffold   # use servers that are already running
```

## Music

`music/` holds the background track and `music/CREDITS.md` its title, artist, URL and licence. Every demo's
`credits.md` repeats them with the voice model and its licence.
