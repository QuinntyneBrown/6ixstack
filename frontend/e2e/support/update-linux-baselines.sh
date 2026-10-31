#!/usr/bin/env bash
# Renders the Linux visual baselines that CI compares against, in the official Playwright container.
# The API and `ng serve` run on the host; start them first (npm run e2e:serve), then run this script.
# Usage: e2e/support/update-linux-baselines.sh [playwright args...]
set -euo pipefail
cd "$(dirname "$0")/../.."
version=$(node -p "require('@playwright/test/package.json').version")
docker run --rm --ipc=host --add-host=host.docker.internal:host-gateway \
  -v "$PWD":/work -w /work \
  -e PW_BASE_URL=http://host.docker.internal:4200 -e CI= \
  "mcr.microsoft.com/playwright:v${version}-noble" \
  npx playwright test --update-snapshots=all "$@"
