const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.profiles'::regclass;");
    console.log('Triggers on profiles:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
