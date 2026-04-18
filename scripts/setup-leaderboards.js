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
      -- 1. Helper for top authors (by likes on their reviews)
      CREATE OR REPLACE FUNCTION public.get_top_authors_by_likes(p_limit int)
      RETURNS TABLE (
        user_id UUID,
        name TEXT,
        avatar_url TEXT,
        metric_value BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          r.user_id,
          p.name,
          p.avatar_url,
          COUNT(rr.id) as metric_value
        FROM public.reviews r
        JOIN public.profiles p ON r.user_id = p.id
        JOIN public.review_ratings rr ON r.id = rr.review_id
        WHERE rr.rating >= 4 -- Likes
        GROUP BY r.user_id, p.name, p.avatar_url
        ORDER BY metric_value DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- 2. Helper for top commenters
      CREATE OR REPLACE FUNCTION public.get_top_commenters(p_limit int)
      RETURNS TABLE (
        user_id UUID,
        name TEXT,
        avatar_url TEXT,
        metric_value BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          rc.user_id,
          p.name,
          p.avatar_url,
          COUNT(rc.id) as metric_value
        FROM public.review_comments rc
        JOIN public.profiles p ON rc.user_id = p.id
        GROUP BY rc.user_id, p.name, p.avatar_url
        ORDER BY metric_value DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- 3. Helper for top publicists (approved content only)
      CREATE OR REPLACE FUNCTION public.get_top_publicists(p_limit int)
      RETURNS TABLE (
        user_id UUID,
        name TEXT,
        avatar_url TEXT,
        metric_value BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.created_by as user_id,
          p.name,
          p.avatar_url,
          COUNT(c.id) as metric_value
        FROM public.content c
        JOIN public.profiles p ON c.created_by = p.id
        WHERE c.status = 'approved'
        GROUP BY c.created_by, p.name, p.avatar_url
        ORDER BY metric_value DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(sql);
    console.log('Leaderboard aggregation functions created successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
