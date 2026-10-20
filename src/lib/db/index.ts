import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getLogger } from '@/lib/logger';

const log = getLogger('db');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false'
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

// Handle unexpected pool errors to prevent crashes
pool.on('error', (err) => {
  log.error('Unexpected database pool error', err);
});

export const db = drizzle(pool, { schema });
