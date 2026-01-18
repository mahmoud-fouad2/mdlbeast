const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a.virginia-postgres.render.com/mdlbeastdb?ssl=true';

const client = new Client({
  connectionString: connectionString,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    const sqlPath = path.join(__dirname, '13_add_permissions_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration successful.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
