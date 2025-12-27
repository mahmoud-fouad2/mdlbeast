#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +"%Y-%m-%dT%H%M%SZ")
NAME="project-backup-${TIMESTAMP}.tar.gz"
TMPDIR=$(mktemp -d)

echo "Creating DB dump..."
pg_dump --format=custom --dbname="$DATABASE_URL" -f "$TMPDIR/db.dump"

echo "Copying uploads..."
mkdir -p "$TMPDIR/uploads"
if [ -d "uploads" ]; then
  cp -a uploads/. "$TMPDIR/uploads/"
fi

# Export some safe settings
echo "Writing settings snapshot..."
node -e "const fs=require('fs'); fs.writeFileSync('$TMPDIR/settings.json', JSON.stringify({ generatedAt: new Date().toISOString() }));"

echo "Creating archive $NAME"
tar -czf "$NAME" -C "$TMPDIR" .

echo "Archive created: $NAME"

echo "Done."