const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  try {
    const { data: playlists } = await supabase
      .from('playlists')
      .select('id, title')
      .ilike('title', '%самолёте%');
    
    console.log('Playlists:', JSON.stringify(playlists, null, 2));
    
    if (playlists && playlists.length > 0) {
      const id = playlists[0].id;
      const { data: items } = await supabase
        .from('playlist_items')
        .select('*')
        .eq('playlist_id', id);
      console.log('Items for ' + id + ':', JSON.stringify(items, null, 2));

      if (items && items.length > 0) {
        const contentIds = items.map(i => i.content_id);
        const { data: content } = await supabase
          .from('content')
          .select('id, title, status')
          .in('id', contentIds);
        console.log('Content entries:', JSON.stringify(content, null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

check();
