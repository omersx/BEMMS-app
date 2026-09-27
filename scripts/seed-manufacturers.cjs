const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
});

const defaultManufacturers = [
  { name: 'B. Braun', code: 'BBRAUN', country: 'Germany', website: 'https://www.bbraun.com' },
  { name: 'Baxter International', code: 'BAXTER', country: 'United States', website: 'https://www.baxter.com' },
  { name: 'Beckman Coulter', code: 'BECKMAN', country: 'United States', website: 'https://www.beckmancoulter.com' },
  { name: 'Canon Medical Systems', code: 'CANON', country: 'Japan', website: 'https://global.medical.canon' },
  { name: 'Dentsply Sirona', code: 'SIRONA', country: 'United States', website: 'https://www.dentsplysirona.com' },
  { name: 'Dräger (Draeger)', code: 'DRAEGER', country: 'Germany', website: 'https://www.draeger.com' },
  { name: 'Fresenius Medical Care', code: 'FRESENIUS', country: 'Germany', website: 'https://www.freseniusmedicalcare.com' },
  { name: 'Fujifilm Healthcare', code: 'FUJIFILM', country: 'Japan', website: 'https://healthcaresolutions-us.fujifilm.com' },
  { name: 'GE HealthCare', code: 'GE', country: 'United States', website: 'https://www.gehealthcare.com' },
  { name: 'Getinge / Maquet', code: 'GETINGE', country: 'Sweden', website: 'https://www.getinge.com' },
  { name: 'Hamilton Medical', code: 'HAMILTON', country: 'Switzerland', website: 'https://www.hamilton-medical.com' },
  { name: 'Medtronic', code: 'MEDTRONIC', country: 'United States', website: 'https://www.medtronic.com' },
  { name: 'Mindray', code: 'MINDRAY', country: 'China', website: 'https://www.mindray.com' },
  { name: 'Nihon Kohden', code: 'NIHON_KOHDEN', country: 'Japan', website: 'https://www.nihonkohden.com' },
  { name: 'Olympus', code: 'OLYMPUS', country: 'Japan', website: 'https://www.olympus-global.com' },
  { name: 'Philips Healthcare', code: 'PHILIPS', country: 'Netherlands', website: 'https://www.philips.com/healthcare' },
  { name: 'Planmeca', code: 'PLANMECA', country: 'Finland', website: 'https://www.planmeca.com' },
  { name: 'Roche Diagnostics', code: 'ROCHE', country: 'Switzerland', website: 'https://diagnostics.roche.com' },
  { name: 'Schiller', code: 'SCHILLER', country: 'Switzerland', website: 'https://www.schiller.ch' },
  { name: 'Siemens Healthineers', code: 'SIEMENS', country: 'Germany', website: 'https://www.siemens-healthineers.com' },
  { name: 'Stryker', code: 'STRYKER', country: 'United States', website: 'https://www.stryker.com' },
  { name: 'Zoll Medical', code: 'ZOLL', country: 'United States', website: 'https://www.zoll.com' },
];

async function main() {
  const orgRes = await pool.query('SELECT id, name FROM organizations LIMIT 1');
  if (orgRes.rows.length === 0) {
    console.error('No organization found!');
    process.exit(1);
  }
  const org = orgRes.rows[0];
  console.log(`Using organization: ${org.name} (${org.id})`);

  let added = 0;
  for (const mfr of defaultManufacturers) {
    const exist = await pool.query(
      'SELECT id FROM manufacturers WHERE organization_id = $1 AND name = $2',
      [org.id, mfr.name]
    );
    if (exist.rows.length === 0) {
      await pool.query(
        `INSERT INTO manufacturers (id, organization_id, name, code, country, website, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW(), NOW())`,
        [org.id, mfr.name, mfr.code, mfr.country, mfr.website]
      );
      console.log(` + Added: ${mfr.name} (${mfr.country})`);
      added++;
    } else {
      console.log(` = Already exists: ${mfr.name}`);
    }
  }

  const allMfrs = await pool.query(
    'SELECT name, country FROM manufacturers WHERE organization_id = $1 ORDER BY name ASC',
    [org.id]
  );
  console.log(`\nTotal Available Manufacturers: ${allMfrs.rows.length}`);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
