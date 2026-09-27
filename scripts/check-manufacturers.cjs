const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

async function main() {
  const res = await pool.query('SELECT count(*) FROM manufacturers');
  console.log('Current manufacturers count:', res.rows[0].count);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
