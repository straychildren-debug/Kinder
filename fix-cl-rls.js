const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Fixing club_members RLS...');

    // 1. Give club owners the ability to become owners in club_members
    await client.query(`
      DROP POLICY IF EXISTS "Club owner can insert themselves" ON public.club_members;
    `);
    
    await client.query(`
      CREATE POLICY "Club owner can insert themselves"
      ON public.club_members FOR INSERT WITH CHECK (
          auth.uid() = user_id 
          AND EXISTS (
              SELECT 1 FROM public.clubs c
              WHERE c.id = club_members.club_id
              AND c.owner_id = auth.uid()
          )
      );
    `);
    
    console.log('Updating club category constraint...');
    // 2. Change 'арт' clubs to 'кино'
    await client.query(`UPDATE public.clubs SET category = 'кино' WHERE category = 'арт';`);
    
    // 3. Drop and replace constraint
    await client.query(`
       ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_category_check;
    `);
    await client.query(`
       ALTER TABLE public.clubs ADD CONSTRAINT clubs_category_check CHECK (category IN ('кино', 'книги'));
    `);

    // Let's also check if user needs to be retroactively added to their clubs
    const res = await client.query(`
      INSERT INTO public.club_members (club_id, user_id, role)
      SELECT c.id, c.owner_id, 'owner'
      FROM public.clubs c
      LEFT JOIN public.club_members cm ON cm.club_id = c.id AND cm.user_id = c.owner_id
      WHERE cm.id IS NULL;
    `);
    console.log(`Added ${res.rowCount} missing owners to club_members.`);

    console.log('Done!');
  } catch(err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
