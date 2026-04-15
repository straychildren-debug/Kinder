const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE public.club_members SET role = 'owner' WHERE role = 'member' AND user_id IN (SELECT owner_id FROM public.clubs WHERE id = club_members.club_id);");
  console.log('Fixed owner roles');
  await client.end();
}
run();
