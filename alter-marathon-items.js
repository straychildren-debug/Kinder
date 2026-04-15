const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Altering marathon items to include content_id...');

    await client.query(`
      ALTER TABLE public.club_marathon_items 
      ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.content(id) ON DELETE SET NULL;
    `);
    console.log('Tables altered successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
