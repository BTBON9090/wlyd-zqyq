#!/usr/bin/env bash
# 把 design/media/*.svg 渲染成 public/media 下的 WebP。
# 需要：Chrome（含 headless shell）与 cwebp。
# 用法：bash design/render-media.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/design/media"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

find_chrome() {
  if [ -n "${CHROME:-}" ]; then echo "$CHROME"; return; fi
  local shell_bin
  shell_bin="$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-*/chrome-headless-shell 2>/dev/null | sort | tail -1 || true)"
  if [ -n "$shell_bin" ]; then echo "$shell_bin"; return; fi
  for app in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
             "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [ -x "$app" ] && { echo "$app"; return; }
  done
  echo "找不到 Chrome，可用 CHROME=/path/to/chrome 指定" >&2
  exit 1
}

CHROME_BIN="$(find_chrome)"
echo "Chrome: $CHROME_BIN"

render() {
  local svg="$1" out="$2" w="$3" h="$4"
  mkdir -p "$(dirname "$out")"
  "$CHROME_BIN" --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 --window-size="$w,$h" \
    --user-data-dir="$TMP/profile" --virtual-time-budget=2000 \
    --screenshot="$TMP/render.png" "file://$svg" >/dev/null 2>&1
  cwebp -quiet -q 84 -m 6 -mt "$TMP/render.png" -o "$out"
  printf '  %-46s %sx%s  %s\n' "${out#"$ROOT"/}" "$w" "$h" "$(du -h "$out" | cut -f1 | tr -d ' ')"
}

for svg in "$SRC"/*.svg; do
  name="$(basename "$svg" .svg)"
  w="$(sed -n 's/.*<svg[^>]*width="\([0-9][0-9]*\)".*/\1/p' "$svg" | head -1)"
  h="$(sed -n 's/.*<svg[^>]*height="\([0-9][0-9]*\)".*/\1/p' "$svg" | head -1)"
  [ -n "$w" ] && [ -n "$h" ] || { echo "跳过 ${name}：无法读取尺寸" >&2; continue; }
  case "$name" in
    hero-*) out="$ROOT/public/media/banners/$name.webp" ;;
    service-cover-*) out="$ROOT/public/media/services/$name.webp" ;;
    *) out="$ROOT/public/media/placeholders/$name.webp" ;;
  esac
  render "$svg" "$out" "$w" "$h"
done
echo "完成。"
