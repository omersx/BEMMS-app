const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

const defaultCategories = [
  { name: 'Patient Monitor', code: 'PAT_MON', riskClassification: 'class_iib', criticalityLevel: 'high', defaultPmIntervalDays: 180, description: 'Multi-parameter patient vital signs monitor' },
  { name: 'Infusion & Syringe Pump', code: 'INF_PUMP', riskClassification: 'class_iib', criticalityLevel: 'high', defaultPmIntervalDays: 180, description: 'Electronic intravenous infusion and syringe pump' },
  { name: 'Defibrillator / AED', code: 'DEFIB', riskClassification: 'class_iii', criticalityLevel: 'critical', defaultPmIntervalDays: 90, description: 'Emergency cardiac defibrillator and monitor' },
  { name: 'Mechanical Ventilator', code: 'VENT', riskClassification: 'class_iii', criticalityLevel: 'critical', defaultPmIntervalDays: 90, description: 'ICU and emergency mechanical ventilator' },
  { name: 'Diagnostic Ultrasound', code: 'USOUND', riskClassification: 'class_iia', criticalityLevel: 'medium', defaultPmIntervalDays: 180, description: 'Clinical diagnostic ultrasound imaging system' },
  { name: 'Electrosurgical Unit (ESU)', code: 'ESU', riskClassification: 'class_iib', criticalityLevel: 'high', defaultPmIntervalDays: 180, description: 'Surgical diathermy and electrocautery generator' },
  { name: 'ECG / EKG Machine', code: 'ECG', riskClassification: 'class_iia', criticalityLevel: 'medium', defaultPmIntervalDays: 180, description: '12-lead diagnostic electrocardiograph' },
  { name: 'Clinical Centrifuge & Laboratory Analyzers', code: 'LAB_EQ', riskClassification: 'class_iia', criticalityLevel: 'medium', defaultPmIntervalDays: 180, description: 'Laboratory centrifuge and automated analyzer' },
  { name: 'X-Ray & Medical Imaging', code: 'XRAY', riskClassification: 'class_iib', criticalityLevel: 'high', defaultPmIntervalDays: 180, description: 'Diagnostic radiography and digital X-ray system' },
  { name: 'Dental Delivery Unit & Chair', code: 'DENT_UNIT', riskClassification: 'class_iia', criticalityLevel: 'medium', defaultPmIntervalDays: 180, description: 'Operatory dental chair and instrument unit' },
];

async function main() {
  const orgRes = await pool.query('SELECT id, name FROM organizations LIMIT 1');
  if (orgRes.rows.length === 0) {
    console.error('No organization found!');
    process.exit(1);
  }
  const org = orgRes.rows[0];
  console.log(`Using organization: ${org.name} (${org.id})`);

  for (const cat of defaultCategories) {
    const existing = await pool.query(
      'SELECT id FROM device_categories WHERE organization_id = $1 AND code = $2',
      [org.id, cat.code]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO device_categories (id, organization_id, name, code, risk_classification, criticality_level, default_pm_interval_days, description, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [org.id, cat.name, cat.code, cat.riskClassification, cat.criticalityLevel, cat.defaultPmIntervalDays, cat.description]
      );
      console.log(` + Created category: ${cat.name} (${cat.code})`);
    } else {
      console.log(` = Already exists: ${cat.name} (${cat.code})`);
    }
  }

  const allCats = await pool.query('SELECT name, code, risk_classification FROM device_categories WHERE organization_id = $1', [org.id]);
  console.log(`\nAvailable Device Categories (${allCats.rows.length}):`);
  allCats.rows.forEach(c => console.log(` • [${c.code}] ${c.name} (${c.risk_classification})`));

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
