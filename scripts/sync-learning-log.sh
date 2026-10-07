#!/bin/bash
# Publishes LEARNING-LOG.md (the source of truth, in this repo) to the page Pepper reads.
# Runs on the Mac at 18:00 Sun-Thu (com.ilan.learninglog-sync), half an hour after the end-of-day agent writes the
# day's signal, or by hand any time.
#
# Checks first, then hands the file to YOUR publish command. Nothing is published unless you configure one:
#   LEARNINGLOG_PUBLISH_CMD   shell command that publishes the file whose path is in $LEARNINGLOG_FILE
#                             (put it in .env). Example:  LEARNINGLOG_PUBLISH_CMD='bash ~/sync-old.sh "$LEARNINGLOG_FILE"'
# Safety, because publishing is outward and may be cached or indexed:
#   - refuses an empty file, a file over 500KB (the md.page cap), or one that looks like it contains a secret;
#   - skips when the file is unchanged since the last successful publish;
#   - on any failure exits non-zero, records it in data/learninglog-sync/status.json (shown on /health) and
#     never updates the "last published" fingerprint.
# Overrides for tests: LEARNING_LOG_FILE, SYNC_STATE_DIR.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="${LEARNING_LOG_FILE:-$ROOT/LEARNING-LOG.md}"
STATE="${SYNC_STATE_DIR:-$ROOT/data/learninglog-sync}"
MAX_BYTES=500000
mkdir -p "$STATE"

# .env is read for the publish command only; shell variables win.
if [ -z "${LEARNINGLOG_PUBLISH_CMD:-}" ] && [ -f "$ROOT/.env" ]; then
  line="$(grep -E '^LEARNINGLOG_PUBLISH_CMD=' "$ROOT/.env" | tail -1 || true)"
  if [ -n "$line" ]; then LEARNINGLOG_PUBLISH_CMD="${line#LEARNINGLOG_PUBLISH_CMD=}"; LEARNINGLOG_PUBLISH_CMD="${LEARNINGLOG_PUBLISH_CMD%\"}"; LEARNINGLOG_PUBLISH_CMD="${LEARNINGLOG_PUBLISH_CMD#\"}"; LEARNINGLOG_PUBLISH_CMD="${LEARNINGLOG_PUBLISH_CMD%\'}"; LEARNINGLOG_PUBLISH_CMD="${LEARNINGLOG_PUBLISH_CMD#\'}"; fi
fi

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | tr '\n' ' '; }
record() { # ok(true|false) message
  prev_ok="$(sed -n 's/.*"lastSuccessAt": *"\([^"]*\)".*/\1/p' "$STATE/status.json" 2>/dev/null | head -1)"
  [ "$1" = true ] && prev_ok="$(now)"
  printf '{\n  "ok": %s,\n  "at": "%s",\n  "message": "%s",\n  "lastSuccessAt": "%s"\n}\n' "$1" "$(now)" "$(json_escape "$2")" "$prev_ok" > "$STATE/status.json.tmp" && mv "$STATE/status.json.tmp" "$STATE/status.json"
}
fail() { echo "learninglog-sync FAILED: $1" >&2; record false "$1"; exit "${2:-1}"; }

[ -f "$FILE" ] || fail "no learning log at $FILE"
size="$(wc -c < "$FILE" | tr -d ' ')"
[ "$size" -gt 0 ] || fail "learning log is empty; refusing to publish an empty page"
[ "$size" -le "$MAX_BYTES" ] || fail "learning log is $size bytes, over the $MAX_BYTES limit (archive old §2 entries into LEARNING-LOG-ARCHIVE.md)"

# Secret scan: report the line numbers, never the secret.
hits="$(grep -n -E -- '(xox[abprs]-[A-Za-z0-9-]{10,}|sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})' "$FILE" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//' || true)"
[ -z "$hits" ] || fail "possible secret on line(s) $hits of the learning log; not published"

if command -v shasum >/dev/null 2>&1; then hash="$(shasum -a 256 "$FILE" | cut -d' ' -f1)"; else hash="$(sha256sum "$FILE" | cut -d' ' -f1)"; fi
if [ -f "$STATE/published.sha256" ] && [ "$(cat "$STATE/published.sha256")" = "$hash" ]; then
  echo "learninglog-sync: unchanged since the last publish, nothing to do"; record true "unchanged since last publish"; exit 0
fi

[ -n "${LEARNINGLOG_PUBLISH_CMD:-}" ] || fail "LEARNINGLOG_PUBLISH_CMD is not set, so nothing was published. Set it in .env to the command that publishes the page (it receives the file path in \$LEARNINGLOG_FILE)." 3

export LEARNINGLOG_FILE="$FILE"
if out="$(bash -c "$LEARNINGLOG_PUBLISH_CMD" 2>&1)"; then
  printf '%s\n' "$hash" > "$STATE/published.sha256"
  echo "learninglog-sync: published ($size bytes)"; record true "published $size bytes"
else
  code=$?; fail "publish command exited $code: $(printf '%s' "$out" | tail -c 300)" 4
fi
