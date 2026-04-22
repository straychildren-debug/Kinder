const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple env parser
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

async function check() {
  try {
    console.log('Searching for playlist...');
    const { data: playlists } = await supabase
      .from('playlists')
      .select('id, title')
      .ilike('title', '%самолёте%');
    
    console.log('Playlists found:', playlists);
    
    if (playlists && playlists.length > 0) {
      const id = playlists[0].id;
      const { data: items } = await supabase
        .from('playlist_items')
        .select('*')
        .eq('playlist_id', id);
      console.log('Items in playlist_items for ' + id + ':', items?.length || 0);
      if (items && items.length > 0) {
        console.log('Content IDs:', items.map(i => i.content_id));
        const { data: content } = await supabase
          .from('content')
          .select('id, title')
          .in('id', items.map(i => i.content_id));
        console.log('Actual content found in "content" table:', content?.length || 0);
      }
    } else {
      console.log('No playlist found with that name.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
