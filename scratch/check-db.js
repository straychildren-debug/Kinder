
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency on dotenv
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('--- DIAGNOSTIC START ---');
  console.log('URL:', supabaseUrl);
  
  try {
    // 1. Content table
    const { data: content, error: contentError, count: contentCount } = await supabase
      .from('content')
      .select('id, title, status', { count: 'exact' });
      
    if (contentError) {
      console.error('Error fetching content:', contentError.message);
    } else {
      console.log(`Content table total: ${contentCount} rows.`);
      const approved = content ? content.filter(c => c.status === 'approved') : [];
      console.log(`Approved items (shown on main page): ${approved.length}`);
      
      if (approved.length === 0 && (contentCount || 0) > 0) {
        console.warn('WARNING: Content exists but none is status="approved".');
        console.log('Sample content status:', content.slice(0, 3).map(c => `${c.title}: ${c.status}`));
      }
    }

    // 2. Profiles
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesError) console.error('Error profiles:', profilesError.message);
    else console.log(`Profiles: ${profilesCount} rows.`);

    // 3. Activity (Phase 3)
    const { count: activityCount, error: activityError } = await supabase
      .from('activity_events')
      .select('*', { count: 'exact', head: true });
    
    if (activityError) console.error('Error activity_events:', activityError.message);
    else console.log(`Activity events: ${activityCount} rows.`);

    console.log('--- DIAGNOSTIC END ---');
  } catch (err) {
    console.error('Unexpected error during diagnostic:', err);
  }
}

checkData();
