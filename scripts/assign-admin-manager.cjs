const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

async function main() {
  const userRes = await pool.query("SELECT id, full_name, email FROM users WHERE email = 'admin@bemms.local'");
  if (userRes.rows.length === 0) {
    console.error('System Administrator user not found!');
    process.exit(1);
  }

  const admin = userRes.rows[0];
  console.log(`Found admin: ${admin.full_name} (${admin.id})`);

  const updateRes = await pool.query(
    "UPDATE departments SET manager_user_id = $1 WHERE manager_user_id IS NULL RETURNING id, name, code",
    [admin.id]
  );

  console.log(`Assigned ${admin.full_name} as manager to ${updateRes.rows.length} department(s):`);
  updateRes.rows.forEach((d) => console.log(` - [${d.code}] ${d.name}`));

  const checkRes = await pool.query(
    "SELECT COUNT(*) as count FROM departments WHERE manager_user_id IS NULL AND status = 'active'"
  );
  console.log(`Active departments without manager remaining: ${checkRes.rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
