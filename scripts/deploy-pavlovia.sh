#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env
set +a

if [ -z "${PAVLOVIA_TOKEN:-}" ]; then
  echo "PAVLOVIA_TOKEN is not set. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

npm run build
npx gh-pages -d dist -b pavlovia-pages \
  -r "https://a.nemet:${PAVLOVIA_TOKEN}@gitlab.pavlovia.org/a.nemet/gradcpt-web-mind.git"
