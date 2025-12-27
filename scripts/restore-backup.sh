#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="$1"
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 <archive.tar.gz>"; exit 1
fi

echo "Extracting archive..."
TMPDIR=$(mktemp -d)
tar -xzf "$ARCHIVE" -C "$TMPDIR"

if [ -f "$TMPDIR/db.dump" ]; then
  echo "Restoring DB from db.dump (destructive)..."
  pg_restore --clean --if-exists --dbname="$DATABASE_URL" "$TMPDIR/db.dump"
else
  echo "No db.dump found in archive"; exit 1
fi

if [ -d "$TMPDIR/uploads" ]; then
  echo "Restoring uploads..."
  rm -rf uploads || true
  mkdir -p uploads
  cp -a "$TMPDIR/uploads/." uploads/
fi

echo "Restore completed"