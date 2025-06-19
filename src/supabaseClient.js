import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
'https://supabase.com/dashboard/project/pocinziylgkavgitjcty', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY2lueml5bGdrYXZnaXRqY3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjYyNTYsImV4cCI6MjA2NTkwMjI1Nn0.3Kejz9pQOTJHM4fCo14vWMX2RGecG069nE2KnYsAYhc'
);

export default supabase;
