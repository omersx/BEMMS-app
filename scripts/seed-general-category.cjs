const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

async function main() {
  const orgRes = await pool.query('SELECT id, name FROM organizations LIMIT 1');
  if (orgRes.rows.length === 0) {
    console.error('No organization found');
    process.exit(1);
  }
  const orgId = orgRes.rows[0].id;

  const exist = await pool.query(
    'SELECT id, name FROM device_categories WHERE organization_id = $1 AND code = $2',
    [orgId, 'GENERAL']
  );

  if (exist.rows.length === 0) {
    const res = await pool.query(
      `INSERT INTO device_categories (
        id, organization_id, name, code, risk_classification,
        criticality_level, default_pm_interval_days, description,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'General Medical Equipment', 'GENERAL',
        'class_i', 'medium', 365, 'General and unclassified medical equipment',
        NOW(), NOW()
      ) RETURNING id, name`,
      [orgId]
    );
    console.log('Created GENERAL category:', res.rows[0]);
  } else {
    console.log('GENERAL category already exists:', exist.rows[0]);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
