// Migration script to add attachment_count column
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a.virginia-postgres.render.com/mdlbeastdb',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add attachment_count column
    const result = await client.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_count VARCHAR(255) DEFAULT '0';
    `);
    console.log('✅ Column attachment_count added successfully');

    // Update existing rows
    const updateResult = await client.query(`
      UPDATE documents SET attachment_count = '0' WHERE attachment_count IS NULL;
    `);
    console.log(`✅ Updated ${updateResult.rowCount} rows`);

    // Verify the column exists
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'attachment_count';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:');
      console.log(verifyResult.rows[0]);
    } else {
      console.log('❌ Column not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

runMigration();
