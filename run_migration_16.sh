#!/bin/bash

# Shell command to run the migration on Render.com
# Copy and paste this in Render Shell

# Navigate to backend directory
cd backend

# Run the migration script
node -e "
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✓ Connected to database');
  
  const sqlPath = path.join(__dirname, 'scripts', '16_add_seen_by_requester.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Running migration: 16_add_seen_by_requester.sql');
  
  await client.query(sql);
  console.log('✓ Migration completed successfully');
  
  await client.end();
  console.log('✓ Connection closed');
})().catch(err => {
  console.error('✗ Migration failed:', err);
  process.exit(1);
});
"

# OR use the simpler psql command:
# psql $DATABASE_URL < backend/scripts/16_add_seen_by_requester.sql
