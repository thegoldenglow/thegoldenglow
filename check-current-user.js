import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL and Service Role Key are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentUser() {
    try {
        // Get BananBenBadr's complete profile
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', 'BananBenBadr');

        if (error) {
            console.error('Error fetching profile:', error);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('No profile found for BananBenBadr');
            return;
        }

        const user = profiles[0];
        console.log('BananBenBadr complete profile:');
        console.log('ID:', user.id);
        console.log('User ID:', user.user_id);
        console.log('Username:', user.username);
        console.log('Full profile:', JSON.stringify(user, null, 2));

        // Check what the UserContext would use for fetching referrals
        console.log('\n--- Testing referral queries ---');
        
        // Query 1: Using user.id (what UserContext currently does)
        console.log('\n1. Query using user.id (', user.id, '):');
        const { data: referralsById, error: refByIdError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.id);
        
        if (refByIdError) {
            console.log('Error:', refByIdError.message);
        } else {
            console.log('Results:', referralsById?.length || 0, 'referrals found');
        }

        // Query 2: Using user.user_id (what should be used)
        console.log('\n2. Query using user.user_id (', user.user_id, '):');
        const { data: referralsByUserId, error: refByUserIdError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.user_id);
        
        if (refByUserIdError) {
            console.log('Error:', refByUserIdError.message);
        } else {
            console.log('Results:', referralsByUserId?.length || 0, 'referrals found');
            if (referralsByUserId && referralsByUserId.length > 0) {
                console.log('Referral details:', JSON.stringify(referralsByUserId, null, 2));
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkCurrentUser();