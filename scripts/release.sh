#!/bin/sh
# Publish the site in one command: install exactly what the lock file says,
# build and run every test, deploy the pages and the Worker together
# (wrangler deploy, then IndexNow), and check the live site afterwards
# (scripts/smoke-live.mjs). Stops at the first step that fails; nothing is
# deployed unless the tests pass.
#
#   sh scripts/release.sh
set -eu
cd "$(dirname "$0")/.."

branch=$(git branch --show-current)
if [ "$branch" != main ]; then
  echo "release: this is '$branch'; publish from main" >&2
  exit 1
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "release: there are uncommitted changes; commit or set them aside first" >&2
  exit 1
fi
echo "release: publishing $(git log -1 --format='%h %s')"

npm ci
npm test
npm run deploy
node scripts/smoke-live.mjs https://realisstudio.com
echo "release: live, and every check passed"
