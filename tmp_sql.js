const { createClient } = require('@supabase/supabase-js');
const url = "https://rreomovpzlbzxmxkmebr.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZW9tb3ZwemxienhteGttZWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE1MjgxMCwiZXhwIjoyMDkxNzI4ODEwfQ.QAwEby1UDHAyisQO9mFwqJOSQfxu3uHr0k51an31adU";
const supabase = createClient(url, key);
(async () => {
  const { error } = await supabase.rpc('execute_sql', {
    sql: 'ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS background_url TEXT;'
  });
  if (error) {
    console.error('SQL Error:', error);
    process.exit(1);
  }
  console.log('Successfully added background_url column');
})();
