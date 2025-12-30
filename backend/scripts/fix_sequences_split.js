const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  try {
    console.log('Starting sequence fix...');

    // 1. Create sequences if not exist
    await pool.query("CREATE SEQUENCE IF NOT EXISTS doc_in_seq START 1");
    await pool.query("CREATE SEQUENCE IF NOT EXISTS doc_out_seq START 1");

    // 2. Fix INCOMING documents
    console.log('Processing INCOMING documents...');
    const inDocs = await pool.query("SELECT id, created_at FROM documents WHERE type = 'INCOMING' OR barcode LIKE '1-%' ORDER BY created_at ASC");
    let inCounter = 0;
    for (const doc of inDocs.rows) {
      inCounter++;
      const newBarcode = `1-${String(inCounter).padStart(8, '0')}`;
      await pool.query("UPDATE documents SET barcode = $1 WHERE id = $2", [newBarcode, doc.id]);
      console.log(`Updated INCOMING doc ${doc.id} to ${newBarcode}`);
    }

    // 3. Fix OUTGOING documents
    console.log('Processing OUTGOING documents...');
    const outDocs = await pool.query("SELECT id, created_at FROM documents WHERE type = 'OUTGOING' OR barcode LIKE '2-%' ORDER BY created_at ASC");
    let outCounter = 0;
    for (const doc of outDocs.rows) {
      outCounter++;
      const newBarcode = `2-${String(outCounter).padStart(8, '0')}`;
      await pool.query("UPDATE documents SET barcode = $1 WHERE id = $2", [newBarcode, doc.id]);
      console.log(`Updated OUTGOING doc ${doc.id} to ${newBarcode}`);
    }

    // 4. Reset sequences
    // setval(seq, val) sets the 'last value'. The next nextval() will return val+1.
    // If counter is 0, we want next to be 1. So setval to 0? Or 1 with is_called=false?
    // setval('seq', 1, false) -> nextval returns 1.
    // setval('seq', 5, true) -> nextval returns 6.
    
    if (inCounter > 0) {
        await pool.query("SELECT setval('doc_in_seq', $1, true)", [inCounter]);
    } else {
        await pool.query("SELECT setval('doc_in_seq', 1, false)");
    }

    if (outCounter > 0) {
        await pool.query("SELECT setval('doc_out_seq', $1, true)", [outCounter]);
    } else {
        await pool.query("SELECT setval('doc_out_seq', 1, false)");
    }

    console.log(`Sequences reset. IN: ${inCounter}, OUT: ${outCounter}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
