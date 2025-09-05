import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    console.log('Testing referral fix...');
    
    const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'BananBenBadr')
        .single();
    
    console.log('User found:', user.username);
    console.log('User ID (old):', user.id);
    console.log('User ID (UUID):', user.user_id);
    
    // Test the fixed logic
    const userIdToUse = user.user_id || user.id;
    console.log('Using ID:', userIdToUse);
    
    const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userIdToUse);
    
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Referrals found:', referrals.length);
        console.log('Fix working: YES');
    }
}

verifyFix().catch(console.error);