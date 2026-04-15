const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:UdhRKFn9pwtVJjRrN9Vb@db.rreomovpzlbzxmxkmebr.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');
    const sql = fs.readFileSync('storage_setup.sql', 'utf8');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
