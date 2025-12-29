const { Pool } = require('pg')
;(async function(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const tables = ['documents','barcode_timeline']
    // ensure these start at 1
    for (const t of tables) {
      const seqR = await pool.query("SELECT pg_get_serial_sequence($1,$2) as seq", [t, 'id'])
      const seq = seqR.rows[0] && seqR.rows[0].seq ? seqR.rows[0].seq.replace(/^.*\./,'') : null
      if (!seq) continue
      await pool.query('SELECT setval($1, 1, false)', [seq])
      console.log(`Set ${seq} -> next will return 1 (documents truncated).`)
    }

    // find other tables with serial sequences that were inadvertently reset and fix them to max(id)+1
    const candidateTables = ['barcodes','users','backups','tenants','snapshots','reports']
    for (const t of candidateTables) {
      try {
        const seqR = await pool.query("SELECT pg_get_serial_sequence($1,$2) as seq", [t, 'id'])
        const seq = seqR.rows[0] && seqR.rows[0].seq ? seqR.rows[0].seq.replace(/^.*\./,'') : null
        if (!seq) continue
        const maxR = await pool.query(`SELECT COALESCE(MAX(id),0) as m FROM ${t}`)
        const m = Number(maxR.rows[0].m || 0)
        if (m === 0) {
          await pool.query('SELECT setval($1, 1, false)', [seq])
          console.log(`Table ${t} empty; set ${seq} to return 1 next.`)
        } else {
          await pool.query('SELECT setval($1, $2, true)', [seq, m])
          console.log(`Table ${t} max id ${m}; set ${seq} so next will be ${m+1}.`)
        }
      } catch (e) { console.warn('Skipping', t, e.message) }
    }

    // report final sample
    for (const t of ['documents','barcodes','users']){
      try{
        const seqR = await pool.query("SELECT pg_get_serial_sequence($1,$2) as seq", [t, 'id'])
        const seq = seqR.rows[0] && seqR.rows[0].seq ? seqR.rows[0].seq.replace(/^.*\./,'') : null
        if (!seq) continue
        const last = await pool.query(`SELECT last_value,is_called FROM ${seq} LIMIT 1`).catch(() => null)
        console.log(`${t}: seq=${seq} last=${last ? JSON.stringify(last.rows[0]) : 'n/a'}`)
      }catch(e){console.log('report skip',t,e.message)}
    }

    console.log('Sequence fix complete.')
  } catch (e) {
    console.error('Failed fixing sequences:', e.message || e)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
