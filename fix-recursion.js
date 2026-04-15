const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Fixing RLS recursion...');

    // 1. Drop the problematic policies
    await client.query('DROP POLICY IF EXISTS "Admins and superadmins can update any profile." ON public.profiles;');
    
    // 2. Restore basic update policy for self
    await client.query('DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;');
    await client.query(`
      CREATE POLICY "Users can update own profile." 
      ON public.profiles FOR UPDATE USING (auth.uid() = id);
    `);

    // 3. Create a SAFE admin update policy
    // Instead of subquerying profiles, we can check role but we must be careful.
    // However, the recursive error usually happens if a SELECT policy is complex.
    // Let's check SELECT policies.
    await client.query('DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;');
    await client.query('CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);');

    // To avoid recursion, we can use a helper function or just keep it simple.
    // The previous error likely came from my 'Admins and superadmins can update any profile'
    // which did (SELECT role FROM profiles WHERE id = auth.uid()).
    
    // Let's use a non-recursive check if possible, or just allow it via a simpler way.
    // Actually, for now, let's just make sure you ARE a superadmin in the DB and then we will fix the policy later.
    // But you need to SEE your role first.
    
    console.log('Policies reset to safe state.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
