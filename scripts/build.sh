#!/usr/bin/env bash
set -e

rm -rf dist

# typecheck
tsc --noEmit

esbuild src/background/background.ts src/content/content.ts src/popup/popup.ts \
  --bundle --format=iife --outdir=dist --outbase=src

mkdir -p dist/assets
cp src/popup/popup.html dist/popup/popup.html
cp src/popup/popup.css dist/popup/popup.css
cp src/assets/destroy-logo.png dist/assets/destroy-logo.png
cp src/assets/destroy-logo-white.png dist/assets/destroy-logo-white.png
cp src/content/content.css dist/content/content.css
