import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildConnectionString() {
  // 1) Allow full override via env
  const envConn = process.env.SUPABASE_DB_CONNECTION_STRING;
  if (envConn) return envConn;

  // 2) Try pooler url with password from env
  const poolerPath = path.join(__dirname, 'supabase', '.temp', 'pooler-url');
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Goldenglow123!'; // fallback to known value used elsewhere
  try {
    if (fs.existsSync(poolerPath)) {
      const raw = fs.readFileSync(poolerPath, 'utf8').trim();
      if (raw.startsWith('postgresql://') && dbPassword) {
        // Replace placeholder if present
        const conn = raw.replace('[YOUR-PASSWORD]', encodeURIComponent(dbPassword));
        return conn;
      }
    }
  } catch {}

  // 3) Fallback to direct DB host (may require project to allow direct 5432 access)
  return 'postgresql://postgres.luzpkuypmyidaluitvzh:' + encodeURIComponent(dbPassword) + '@db.luzpkuypmyidaluitvzh.supabase.co:5432/postgres';
}

async function applyMigration() {
  const connectionString = buildConnectionString();
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
    query_timeout: 60000,
    keepAlive: true,
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Determine migration file path: use CLI arg if provided, else default to user_task_progress migration
    const argPath = process.argv[2];
    const migrationPath = argPath
      ? path.resolve(__dirname, '..', argPath)
      : path.join(__dirname, 'supabase', 'migrations', '20250825_create_user_task_progress.sql');

    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Applying migration from: ${migrationPath}`);
    
    // Execute the entire migration as one transaction
    await client.query('BEGIN');
    
    try {
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('Migration applied successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Migration failed, rolled back:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

applyMigration();