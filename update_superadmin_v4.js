const { Client } = require('pg');
const net = require('net');

const connectionString = 'postgresql://postgres:UdhRKFn9pwtVJjRrN9Vb@db.rreomovpzlbzxmxkmebr.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Force IPv4
  ...(net.lookup && { family: 4 }) 
});

async function updateRole() {
  try {
    console.log('Connecting to Supabase (IPv4)...');
    await client.connect();
    const res = await client.query("UPDATE profiles SET role = 'superadmin' WHERE email = 'marat.ismagilovich@gmail.com'");
    console.log('Update successful:', res.rowCount, 'row(s) updated.');
  } catch (err) {
    console.error('Update failed:', err);
    console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:');
    console.log("UPDATE profiles SET role = 'superadmin' WHERE email = 'marat.ismagilovich@gmail.com';");
  } finally {
    await client.end();
  }
}

updateRole();
