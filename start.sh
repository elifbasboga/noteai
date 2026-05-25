#!/bin/sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

(cd "$ROOT_DIR/backend" && npm start) &
BACKEND_PID=$!

cd "$ROOT_DIR"
npx expo start