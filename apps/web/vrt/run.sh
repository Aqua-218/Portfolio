#!/bin/sh
# 見た目テストをPlaywrightのDockerイメージの中で回す。先にpnpm buildしておく。
# 基準画像を作り直すときは: pnpm --filter @portfolio/web vrt --update-snapshots
set -eu
root=$(cd "$(dirname "$0")/../../.." && pwd)
exec docker run --rm --ipc=host \
  -v "$root:/work" -w /work/apps/web \
  -e CI="${CI:-}" \
  mcr.microsoft.com/playwright:v1.64.1-noble@sha256:47b510dd9230bf0b9bfc9b20102241e577ea7a99334ab4c3ca19f19770e9b8ea \
  node node_modules/@playwright/test/cli.js test -c playwright.vrt.config.ts "$@"
