const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rreomovpzlbzxmxkmebr:UdhRKFn9pwtVJjRrN9Vb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL (via Pooler)...');
    
    const sql = `
      -- 1. Add reply_to_id column
      ALTER TABLE public.review_comments 
      ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.review_comments(id) ON DELETE SET NULL;
      
      -- 2. Add comment
      COMMENT ON COLUMN public.review_comments.reply_to_id IS 'ID of the comment being replied to';

      -- 3. Add replied_to_user_name column (optional, but easier for flat lists if we want to avoid extra joins)
      -- Actually, we can join profiles via the reply_to_id -> review_comments.user_id.
    `;
    
    await client.query(sql);
    console.log('Migration executed successfully: reply_to_id added to review_comments');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
