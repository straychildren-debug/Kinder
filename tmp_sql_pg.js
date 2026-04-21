const { Client } = require('pg');
const connectionString = 'postgresql://postgres:UdhRKFn9pwtVJjRrN9Vb@db.rreomovpzlbzxmxkmebr.supabase.co:5432/postgres';
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');
    await client.query('ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS background_url TEXT;');
    console.log('Successfully added background_url column');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}
run();
