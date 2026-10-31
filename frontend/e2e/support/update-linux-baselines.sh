#!/usr/bin/env bash
# Renders the Linux visual baselines that CI compares against, in the official Playwright container.
# The API, `ng serve` (npm run e2e:serve) and Storybook (npx tsx e2e/support/serve-storybook.ts) run on the host;
# start them first, then run this script.
# Usage: e2e/support/update-linux-baselines.sh [playwright args...]
set -euo pipefail
cd "$(dirname "$0")/../.."
version=$(node -p "require('@playwright/test/package.json').version")
docker run --rm --ipc=host --add-host=host.docker.internal:host-gateway \
  -v "$PWD":/work -w /work \
  -e PW_BASE_URL=http://localhost:4200 -e PW_STORYBOOK_URL=http://localhost:6007 -e CI= \
  "mcr.microsoft.com/playwright:v${version}-noble" \
  bash -c 'node e2e/support/forward-to-host.mjs & sleep 1; npx playwright test --update-snapshots=all "$@"' -- "$@"
