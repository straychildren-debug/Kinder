const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('--- Checking for email duplicates ---');
    const res = await client.query("SELECT id, email, role, joined_at FROM public.profiles WHERE email = 'marat.ismagilovich@gmail.com';");
    console.log('Results for email:', res.rows);

    console.log('\n--- Checking for auth user ID ---');
    // We can't query auth.users directly via pg easily without schema permissions, but let's confirm the ID in profiles
    const res2 = await client.query("SELECT COUNT(*) FROM public.profiles;");
    console.log('Total profiles count:', res2.rows[0].count);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
