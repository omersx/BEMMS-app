const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  console.log('Starting Engineer\'s Round database migration...');

  try {
    await client.query('BEGIN');

    // 1. Create enums
    console.log('1. Ensuring enums exist...');
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'round_status') THEN
          CREATE TYPE round_status AS ENUM ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'round_visit_status') THEN
          CREATE TYPE round_visit_status AS ENUM ('pending', 'completed', 'skipped');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TYPE record_version_entity_type ADD VALUE IF NOT EXISTS 'engineer_round';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create engineer_rounds table
    console.log('2. Creating engineer_rounds table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS engineer_rounds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        hospital_id uuid NOT NULL REFERENCES hospitals(id),
        engineer_id uuid NOT NULL REFERENCES users(id),
        round_date date NOT NULL,
        shift_type text NOT NULL DEFAULT 'morning',
        status round_status NOT NULL DEFAULT 'scheduled',
        started_at timestamp with time zone,
        completed_at timestamp with time zone,
        start_signature_id uuid REFERENCES electronic_signatures(id),
        total_departments integer NOT NULL DEFAULT 0,
        completed_departments integer NOT NULL DEFAULT 0,
        total_issues_reported integer NOT NULL DEFAULT 0,
        total_notes integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_engineer_rounds_lookup 
      ON engineer_rounds (organization_id, hospital_id, engineer_id, round_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_engineer_rounds_date 
      ON engineer_rounds (organization_id, round_date, status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_engineer_rounds_engineer 
      ON engineer_rounds (engineer_id, round_date);
    `);

    // 3. Create round_department_visits table
    console.log('3. Creating round_department_visits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS round_department_visits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id uuid NOT NULL REFERENCES engineer_rounds(id) ON DELETE CASCADE,
        department_id uuid NOT NULL REFERENCES departments(id),
        department_name text NOT NULL,
        sequence integer NOT NULL DEFAULT 0,
        status round_visit_status NOT NULL DEFAULT 'pending',
        started_at timestamp with time zone,
        completed_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_round_visits_round 
      ON round_department_visits (round_id, sequence);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_round_visits_dept 
      ON round_department_visits (department_id, round_id);
    `);

    // 4. Create round_visit_notes table
    console.log('4. Creating round_visit_notes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS round_visit_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id uuid NOT NULL REFERENCES round_department_visits(id) ON DELETE CASCADE,
        author_id uuid NOT NULL REFERENCES users(id),
        note_text text NOT NULL,
        device_mentions jsonb DEFAULT '[]'::jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_round_notes_visit 
      ON round_visit_notes (visit_id);
    `);

    // 5. Add round_visit_id to service_tickets
    console.log('5. Adding round_visit_id to service_tickets...');
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'service_tickets' AND column_name = 'round_visit_id'
        ) THEN
          ALTER TABLE service_tickets ADD COLUMN round_visit_id uuid REFERENCES round_department_visits(id);
        END IF;
      END $$;
    `);

    // 6. Ensure settings column on organizations
    console.log('6. Ensuring settings column on organizations...');
    await client.query(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings jsonb;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully! All tables, enums, and foreign keys created.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, transaction rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
