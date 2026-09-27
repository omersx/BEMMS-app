const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

const basicDepts = [
  { name: 'Emergency Department', code: 'EMERG', departmentType: 'Emergency' },
  { name: 'Intensive Care Unit (ICU)', code: 'ICU', departmentType: 'Intensive Care' },
  { name: 'Surgery & Operating Theatre', code: 'SURG', departmentType: 'Surgical' },
  { name: 'Clinical Laboratory', code: 'LAB', departmentType: 'Laboratory' },
  { name: 'Radiology & Medical Imaging', code: 'RAD', departmentType: 'Diagnostic & Imaging' },
  { name: 'Pediatrics', code: 'PED', departmentType: 'Pediatrics' },
  { name: 'Dental Clinic', code: 'DENT', departmentType: 'Dental' },
];

const deptsToRemove = ['BME', 'CARD', 'PHARM', 'MED', 'OBGYN'];

async function main() {
  const hospitalRes = await pool.query('SELECT id, organization_id, name FROM hospitals');
  console.log(`Found ${hospitalRes.rows.length} hospital(s).`);

  for (const hospital of hospitalRes.rows) {
    console.log(`\nSyncing hospital: ${hospital.name} (${hospital.id})`);

    // 1. Remove non-basic departments if they have 0 devices
    for (const code of deptsToRemove) {
      const existing = await pool.query('SELECT id, name FROM departments WHERE hospital_id = $1 AND code = $2', [hospital.id, code]);
      if (existing.rows.length > 0) {
        const deptId = existing.rows[0].id;
        const devCount = await pool.query('SELECT count(*) FROM devices WHERE department_id = $1', [deptId]);
        if (parseInt(devCount.rows[0].count, 10) === 0) {
          await pool.query('DELETE FROM departments WHERE id = $1', [deptId]);
          console.log(`  - Removed ${existing.rows[0].name} (${code})`);
        } else {
          console.log(`  - Skipped removing ${existing.rows[0].name} (${code}) because it contains devices`);
        }
      }
    }

    // 2. If an old lowercase "radiology" exists, update it to Radiology & Medical Imaging (RAD)
    const oldRad = await pool.query('SELECT id FROM departments WHERE hospital_id = $1 AND (code = $2 OR name ILIKE $3)', [hospital.id, 'RADIOL', 'radiology']);
    if (oldRad.rows.length > 0) {
      await pool.query(
        `UPDATE departments
         SET name = 'Radiology & Medical Imaging', code = 'RAD', department_type = 'Diagnostic & Imaging'
         WHERE id = $1`,
        [oldRad.rows[0].id]
      );
      console.log('  - Updated existing radiology department to Radiology & Medical Imaging (RAD)');
    }

    // 3. Insert each of the 7 basic departments if not already present
    for (const d of basicDepts) {
      await pool.query(
        `INSERT INTO departments (id, organization_id, hospital_id, name, code, department_type, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (hospital_id, code) DO UPDATE
         SET name = EXCLUDED.name, department_type = EXCLUDED.department_type`,
        [hospital.organization_id, hospital.id, d.name, d.code, d.departmentType]
      );
      console.log(`  + Ensured ${d.name} (${d.code})`);
    }
  }

  const allDepts = await pool.query(`
    SELECT h.name as hospital_name, d.name as dept_name, d.code, d.department_type
    FROM departments d
    JOIN hospitals h ON d.hospital_id = h.id
    ORDER BY h.name, d.name
  `);

  console.log('\n--- FINAL DEPARTMENTS IN SYSTEM ---');
  allDepts.rows.forEach(r => {
    console.log(`• [${r.code}] ${r.dept_name} (${r.department_type}) — ${r.hospital_name}`);
  });

  await pool.end();
  console.log('\nSync completed successfully!');
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
