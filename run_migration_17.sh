#!/bin/bash
# Run Migration 17: Add unique approval numbers
# Usage: ./run_migration_17.sh

echo "🔄 Running migration 17: Add unique approval numbers..."

psql $DATABASE_URL < backend/scripts/17_add_approval_numbers.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration 17 completed successfully!"
else
  echo "❌ Migration 17 failed!"
  exit 1
fi
