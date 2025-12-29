const { Pool } = require('pg')
;(async function(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const seqs = new Set()
    const known = ['doc_in_seq','doc_out_seq','doc_seq']
    for (const s of known) seqs.add(s)

    const tables = ['documents','barcode_timeline','barcodes']
    for (const t of tables) {
      try {
        const r = await pool.query("SELECT pg_get_serial_sequence($1,$2) as seq", [t, 'id'])
        if (r.rows[0] && r.rows[0].seq) seqs.add(r.rows[0].seq.replace(/^.*\./, ''))
      } catch (e) {}
    }

    const r2 = await pool.query("SELECT sequence_name FROM information_schema.sequences WHERE sequence_name ILIKE '%doc%' OR sequence_name ILIKE '%barc%' OR sequence_name ILIKE '%_id_seq%'")
    for (const row of r2.rows) seqs.add(row.sequence_name)

    console.log('Sequences to reset:', Array.from(seqs).join(', '))

    for (const s of seqs) {
      try {
        const before = await pool.query(`SELECT * FROM ${s} LIMIT 1`).catch(() => null)
        console.log(s, 'before:', before ? before.rows[0] : 'not accessible')
      } catch (e) {
        console.log(s, 'before: error', e.message)
      }
    }

    for (const s of seqs) {
      try {
        await pool.query('SELECT setval($1, 1, false)', [s])
        const r = await pool.query('SELECT nextval($1) as next', [s])
        console.log(s, 'after nextval:', r.rows[0].next)
      } catch (e) {
        console.log('Failed to reset', s, e.message)
      }
    }

    const c = await pool.query('SELECT COUNT(*)::int as cnt FROM documents')
    console.log('documents count:', c.rows[0].cnt)
    const b = await pool.query("SELECT nextval(pg_get_serial_sequence('documents','id')) as nexdoc")
    console.log('documents next id (sample):', b.rows[0].nexdoc)
  } catch (e) {
    console.error('Sequence reset failed:', e.message || e)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
