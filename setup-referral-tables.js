import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupReferralTables() {
  try {
    console.log('Setting up referral tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_referral_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('Trying alternative approach...');
      await setupTablesManually();
    } else {
      console.log('Referral tables created successfully!');
      console.log('Data:', data);
    }
    
  } catch (err) {
    console.error('Error setting up referral tables:', err);
    
    // Try alternative approach
    console.log('Trying manual table creation...');
    await setupTablesManually();
  }
}

async function setupTablesManually() {
  try {
    console.log('Creating referral_codes table...');
    
    // Create referral_codes table
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS referral_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          code VARCHAR(20) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_used_at TIMESTAMP WITH TIME ZONE,
          total_referrals INTEGER DEFAULT 0
        );
      `
    });
    
    if (error1) {
      console.error('Error creating referral_codes table:', error1);
    } else {
      console.log('referral_codes table created successfully!');
    }
    
    // Create indexes
    console.log('Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);'
    });
    
    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);'
    });
    
    // Insert demo data
    console.log('Inserting demo data...');
    const { error: insertError } = await supabase
      .from('referral_codes')
      .upsert([
        { user_id: '00000000-0000-0000-0000-000000000001', code: 'DEMO001', total_referrals: 25 },
        { user_id: '00000000-0000-0000-0000-000000000002', code: 'DEMO002', total_referrals: 18 },
        { user_id: '00000000-0000-0000-0000-000000000003', code: 'DEMO003', total_referrals: 12 },
        { user_id: '00000000-0000-0000-0000-000000000004', code: 'DEMO004', total_referrals: 8 },
        { user_id: '00000000-0000-0000-0000-000000000005', code: 'DEMO005', total_referrals: 5 }
      ], { onConflict: 'code' });
    
    if (insertError) {
      console.error('Error inserting demo data:', insertError);
    } else {
      console.log('Demo data inserted successfully!');
    }
    
    console.log('Referral system setup completed!');
    
  } catch (err) {
    console.error('Error in manual setup:', err);
  }
}

// Run the setup
setupReferralTables().then(() => {
  console.log('Setup process completed.');
  process.exit(0);
}).catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});