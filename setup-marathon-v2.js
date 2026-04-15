const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Setting up marathon V2 tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.club_marathon_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          marathon_id UUID REFERENCES public.club_marathons(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.club_marathon_items ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Marathon items viewable by everyone" ON public.club_marathon_items;
      CREATE POLICY "Marathon items viewable by everyone" ON public.club_marathon_items FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Marathon items insertable by admin/owner" ON public.club_marathon_items;
      CREATE POLICY "Marathon items insertable by admin/owner" ON public.club_marathon_items FOR INSERT WITH CHECK (
          EXISTS (
              SELECT 1 FROM public.club_members cm
              JOIN public.club_marathons m ON m.club_id = cm.club_id
              WHERE cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin')
              AND m.id = marathon_id
          )
      );

      CREATE TABLE IF NOT EXISTS public.club_marathon_participants (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          marathon_id UUID REFERENCES public.club_marathons(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
          item_id UUID REFERENCES public.club_marathon_items(id) ON DELETE CASCADE NOT NULL,
          is_completed BOOLEAN DEFAULT false,
          review_text TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, item_id)
      );

      ALTER TABLE public.club_marathon_participants ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Marathon progress viewable by everyone" ON public.club_marathon_participants;
      CREATE POLICY "Marathon progress viewable by everyone" ON public.club_marathon_participants FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Users can insert own progress" ON public.club_marathon_participants;
      CREATE POLICY "Users can insert own progress" ON public.club_marathon_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own progress" ON public.club_marathon_participants;
      CREATE POLICY "Users can update own progress" ON public.club_marathon_participants FOR UPDATE USING (auth.uid() = user_id);

    `);
    console.log('Tables created successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
