import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ichgjekotnimxmnkkwll.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljaGdqZWtvdG5pbXhtbmtrd2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDkxNTcsImV4cCI6MjA4MDgyNTE1N30.u8AqSMZrws6HcteuO2Jc4QEnqILgTFsEcj5M5KKOrrE';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
