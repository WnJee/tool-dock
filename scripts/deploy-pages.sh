#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-tool-dock}"
BRANCH_NAME="${CLOUDFLARE_PAGES_BRANCH:-main}"
WRANGLER="$ROOT_DIR/node_modules/.bin/wrangler"

cd "$ROOT_DIR"

if [[ ! -x "$WRANGLER" ]]; then
  echo "Wrangler 未安装，请先运行 npm install。" >&2
  exit 1
fi

echo "[1/3] 运行测试"
npm test

echo "[2/3] 构建生产文件"
npm run build

echo "[3/3] 部署到 Cloudflare Pages: $PROJECT_NAME ($BRANCH_NAME)"
"$WRANGLER" pages deploy dist \
  --project-name "$PROJECT_NAME" \
  --branch "$BRANCH_NAME" \
  --commit-dirty=true

echo "部署完成：https://$PROJECT_NAME.pages.dev/"
