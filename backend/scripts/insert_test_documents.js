const { Pool } = require('pg')
;(async function(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const now = new Date().toISOString()
    const docs = [
      ['TEST-IN-1','INCOMING','Alice','Dept A', now, 'Test incoming 1','عادي','وارد','عمومي','notes','','[]', null],
      ['TEST-OUT-1','OUTGOING','Dept B','Bob', now, 'Test outgoing 1','عادي','صادر','عمومي','notes','','[]', null],
    ]

    for (const d of docs) {
      const res = await pool.query(
        `INSERT INTO documents (barcode, type, sender, receiver, date, subject, priority, status, classification, notes, statement, attachments, tenant_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, barcode, created_at`, d)
      console.log('Inserted document:', res.rows[0])
    }

    const next = await pool.query("SELECT nextval(pg_get_serial_sequence('documents','id')) as next")
    console.log('Next documents sequence value (after inserts):', next.rows[0].next)
  } catch (e) {
    console.error('Insert test docs failed:', e.message || e)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
