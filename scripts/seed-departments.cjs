const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

const defaultDepts = [
  { name: 'Emergency Department', code: 'EMERG', departmentType: 'Emergency' },
  { name: 'Intensive Care Unit (ICU)', code: 'ICU', departmentType: 'Intensive Care' },
  { name: 'Surgery & Operating Theatre', code: 'SURG', departmentType: 'Surgical' },
  { name: 'Clinical Laboratory', code: 'LAB', departmentType: 'Laboratory' },
  { name: 'Pediatrics', code: 'PED', departmentType: 'Clinical' },
  { name: 'Biomedical Engineering', code: 'BME', departmentType: 'Biomedical Engineering' },
  { name: 'Cardiology', code: 'CARD', departmentType: 'Clinical' },
  { name: 'Obstetrics & Gynecology', code: 'OBGYN', departmentType: 'Clinical' },
  { name: 'Hospital Pharmacy', code: 'PHARM', departmentType: 'Pharmacy' },
  { name: 'Internal Medicine', code: 'MED', departmentType: 'Clinical' },
];

async function main() {
  const hospitalRes = await pool.query('SELECT id, organization_id, name FROM hospitals');
  console.log(`Found ${hospitalRes.rows.length} hospital(s) to populate.`);

  for (const hospital of hospitalRes.rows) {
    console.log(`Processing hospital: ${hospital.name} (${hospital.id})`);
    for (const d of defaultDepts) {
      await pool.query(
        `INSERT INTO departments (id, organization_id, hospital_id, name, code, department_type, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (hospital_id, code) DO NOTHING`,
        [hospital.organization_id, hospital.id, d.name, d.code, d.departmentType]
      );
    }
  }

  const allDepts = await pool.query(`
    SELECT h.name as hospital_name, d.name as dept_name, d.code, d.department_type
    FROM departments d
    JOIN hospitals h ON d.hospital_id = h.id
    ORDER BY h.name, d.name
  `);

  console.log('\n--- ALL DEPARTMENTS IN SYSTEM ---');
  allDepts.rows.forEach(r => {
    console.log(`• [${r.code}] ${r.dept_name} (${r.department_type || 'N/A'}) — ${r.hospital_name}`);
  });

  await pool.end();
  console.log('\nDone seeding standard departments!');
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
