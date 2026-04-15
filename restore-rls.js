const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Restoring RLS safely...');
    await client.query('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
    await client.query('DROP POLICY IF EXISTS "public_select" ON public.profiles;');
    await client.query('CREATE POLICY "public_select" ON public.profiles FOR SELECT USING (true);');
    await client.query('DROP POLICY IF EXISTS "self_update" ON public.profiles;');
    await client.query('CREATE POLICY "self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);');
    console.log('RLS restored successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
