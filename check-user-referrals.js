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

async function checkUserReferrals() {
    try {
        // Get BananBenBadr's profile
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, user_id, username')
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
        console.log('BananBenBadr profile:', user);

        // Check referrals where BananBenBadr is the referrer
        const { data: referrals, error: refError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.user_id);

        if (refError) {
            console.error('Error fetching referrals:', refError);
            return;
        }

        console.log('\nReferrals where BananBenBadr is the referrer:', referrals);
        console.log('Number of referrals:', referrals?.length || 0);

        // Also check if there are any referrals using the id field
        const { data: referralsById, error: refByIdError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.id);

        if (refByIdError) {
            console.error('Error fetching referrals by id:', refByIdError);
            return;
        }

        console.log('\nReferrals where BananBenBadr is the referrer (using id field):', referralsById);
        console.log('Number of referrals (by id):', referralsById?.length || 0);

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkUserReferrals();