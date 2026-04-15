const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('--- EMERGENCY PURGE: Removing all get_my_role calls ---');
    
    // Drop all policies on profiles
    await client.query('DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Admins and superadmins can update any profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;');
    await client.query('DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;');
    
    // Re-create only the bare minimum for functionality
    await client.query('CREATE POLICY "public_select" ON public.profiles FOR SELECT USING (true);');
    await client.query('CREATE POLICY "self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);');

    // Content: Remove complex role checks
    await client.query('DROP POLICY IF EXISTS "Moderators and admins can view all content" ON public.content;');
    await client.query('DROP POLICY IF EXISTS "Moderators and admins can update content" ON public.content;');
    await client.query('DROP POLICY IF EXISTS "Moderators can view all content" ON public.content;');
    await client.query('DROP POLICY IF EXISTS "Moderators can update content" ON public.content;');

    // Basic content view/update policy
    await client.query('CREATE POLICY "public_content_select" ON public.content FOR SELECT USING (status = \'approved\' OR auth.uid() = created_by);');

    console.log('--- PURGE COMPLETE ---');
    console.log('Recursion should be GONE now. Please refresh.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
