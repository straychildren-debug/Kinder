const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: pending, count: pendingCount } = await supabase
    .from('content')
    .select('id, title', { count: 'exact' })
    .eq('status', 'pending');
    
  console.log('Pending content count:', pendingCount);
  console.log('Pending items:', pending);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, stats');
    
  console.log('User profiles stats:', JSON.stringify(profiles, null, 2));
}

check();
