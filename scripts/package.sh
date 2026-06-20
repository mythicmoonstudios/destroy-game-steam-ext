#!/usr/bin/env bash
set -e

./scripts/build.sh

rm -f destroyed-games-on-steam.zip
python3 -m zipfile -c destroyed-games-on-steam.zip manifest.json dist
