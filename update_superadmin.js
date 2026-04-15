const { Client } = require('pg');
const connectionString = 'postgresql://postgres:UdhRKFn9pwtVJjRrN9Vb@db.rreomovpzlbzxmxkmebr.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function updateRole() {
  try {
    await client.connect();
    const res = await client.query("UPDATE profiles SET role = 'superadmin' WHERE email = 'marat.ismagilovich@gmail.com'");
    console.log('Update successful:', res.rowCount, 'row(s) updated.');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await client.end();
  }
}

updateRole();
