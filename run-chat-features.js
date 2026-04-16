// Run SQL via Supabase's built-in pg_net or direct REST endpoint
const dns = require('dns');
const { Client } = require('pg');
const fs = require('fs');

const sql = fs.readFileSync('chat_features.sql', 'utf8');

// Split into individual statements
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 5 && !s.startsWith('--'));

async function run() {
  // First resolve the IP address (force IPv4)
  const hostname = 'db.rreomovpzlbzxmxkmebr.supabase.co';
  
  let ipv4;
  try {
    const addresses = await dns.promises.resolve4(hostname);
    ipv4 = addresses[0];
    console.log(`Resolved ${hostname} to IPv4: ${ipv4}`);
  } catch (e) {
    console.error('DNS resolution failed:', e.message);
    return;
  }

  const client = new Client({
    host: ipv4,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'UdhRKFn9pwtVJjRrN9Vb',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log(`Connecting to ${ipv4}:5432...`);
    await client.connect();
    console.log('Connected! Running', statements.length, 'statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 70).replace(/\n/g, ' ');
      try {
        await client.query(stmt);
        console.log(`[${i+1}/${statements.length}] OK: ${preview}...`);
      } catch (err) {
        console.log(`[${i+1}/${statements.length}] WARN: ${err.message.substring(0, 100)} | ${preview}...`);
      }
    }
    console.log('\nAll done!');
  } catch (err) {
    console.error('Connection Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
