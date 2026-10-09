#!/bin/sh
# Cloudflare Pages build: copies the public site to dist/ (excludes internal files).
# Build command: sh scripts/build-dist.sh   ·   Output directory: dist
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
for f in *; do
  case "$f" in
    dist|README.md|TEXTOS_NO_PARA_REVISAR.md|scripts|functions|site.config.json|node_modules|package.json|package-lock.json) continue ;;
  esac
  cp -R "$f" dist/
done
echo "dist/ ready: $(find dist -type f | wc -l) files"
