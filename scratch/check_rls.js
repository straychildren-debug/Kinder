const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRLS() {
  try {
    console.log('Checking RLS policies for playlist_items...');
    // We can't directly check policies via supabase-js without postgres access, 
    // but we can try to fetch items as a "nobody" if we weren't already.
    // The previous script used ANON_KEY which is what the browser uses.
    
    // Let's try to fetch specifically for the known ID.
    const plId = 'e9d5dc92-6167-4935-a3a2-9c5975b53c25'; 
    const { data, error } = await supabase
      .from('playlist_items')
      .select('*')
      .eq('playlist_id', plId);
    
    if (error) {
      console.error('Fetch error:', error);
    } else {
      console.log('Items found as anon:', data.length);
    }

    // Let's also check if they exist in 'content' table for anon.
    const contentIds = ['3dc1e15a-c86b-4848-82a9-35d2b59a0bfa', 'd65a246a-f496-4c9c-bf44-f2e678592802'];
    const { data: contents, error: cError } = await supabase
      .from('content')
      .select('id, title, status')
      .in('id', contentIds);
    
    if (cError) {
      console.error('Content fetch error:', cError);
    } else {
      console.log('Contents found as anon:', contents.length);
      console.log('Contents data:', contents);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkRLS();
