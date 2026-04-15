const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT c.id, c.name, c.owner_id, (SELECT count(*) FROM public.club_members WHERE club_id = c.id) as count FROM public.clubs c');
    console.log("Clubs in DB:", res.rows);
    const mRes = await client.query('SELECT cm.club_id, cm.user_id, cm.role FROM public.club_members cm');
    console.log("Members in DB:", mRes.rows);
  } catch(err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
