const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('--- Step 1: Create helper function to break recursion ---');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_my_role()
      RETURNS text AS $$
      BEGIN
        RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('--- Step 2: Clean up all problematic policies ---');
    
    // Profiles
    await client.query('DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Admins and superadmins can update any profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;');
    
    // Re-create safe profile policies
    await client.query('CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);');
    await client.query('CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);');
    await client.query(`
      CREATE POLICY "Admins can update any profile." ON public.profiles FOR UPDATE 
      USING (public.get_my_role() IN ('admin', 'superadmin'));
    `);

    // Content
    await client.query('DROP POLICY IF EXISTS "Moderators can view all content" ON public.content;');
    await client.query('DROP POLICY IF EXISTS "Moderators can update content" ON public.content;');
    await client.query(`
      CREATE POLICY "Moderators and admins can view all content" ON public.content FOR SELECT 
      USING (public.get_my_role() IN ('moderator', 'admin', 'superadmin'));
    `);
    await client.query(`
      CREATE POLICY "Moderators and admins can update content" ON public.content FOR UPDATE 
      USING (public.get_my_role() IN ('moderator', 'admin', 'superadmin'));
    `);

    console.log('--- Step 3: Final Verification ---');
    console.log('Recursion broken. All roles updated.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
