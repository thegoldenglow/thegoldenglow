// Script to add Peymanarjmand77 as an invited user for BananBenBadr
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key to bypass RLS policies
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addReferralRelationship() {
  try {
    console.log('🔍 Adding referral relationship: BananBenBadr -> Peymanarjmand77');
    
    // First, get the user IDs for both users
    console.log('\n📝 Step 1: Finding user IDs...');
    
    const { data: referrerData, error: referrerError } = await supabase
      .from('profiles')
      .select('id, user_id, username')
      .eq('username', 'BananBenBadr')
      .single();
    
    if (referrerError || !referrerData) {
      console.error('❌ Could not find referrer user BananBenBadr:', referrerError?.message);
      return;
    }
    
    const { data: referredData, error: referredError } = await supabase
      .from('profiles')
      .select('id, user_id, username')
      .eq('username', 'Peymanarjmand77')
      .single();
    
    if (referredError || !referredData) {
      console.error('❌ Could not find referred user Peymanarjmand77:', referredError?.message);
      return;
    }
    
    // Use user_id (UUID) for referrals table, fallback to id if user_id is null
    const referrerId = referrerData.user_id || referrerData.id;
    const referredId = referredData.user_id || referredData.id;
    
    console.log(`✅ Found referrer: ${referrerData.username} (ID: ${referrerId})`);
    console.log(`✅ Found referred: ${referredData.username} (ID: ${referredId})`);
    
    // Check if referral relationship already exists
    console.log('\n📝 Step 2: Checking for existing referral...');
    
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .single();
    
    if (existingReferral) {
      console.log('⚠️ Referral relationship already exists!');
      console.log('Existing referral:', existingReferral);
      return;
    }
    
    // Add the referral relationship
    console.log('\n📝 Step 3: Creating/getting referral code for referrer...');
    // First, check if referrer has a referral code
    let { data: existingCode, error: codeCheckError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', referrerId)
      .single();

    let referralCode;
    if (codeCheckError || !existingCode) {
      // Create a referral code for the referrer
      const { data: newCode, error: codeCreateError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: referrerId,
          code: `REF_${referrerId.slice(-8).toUpperCase()}`,
          total_referrals: 0
        })
        .select('code')
        .single();

      if (codeCreateError) {
        console.log('❌ Error creating referral code:', codeCreateError);
        return;
      }
      referralCode = newCode.code;
      console.log(`✅ Created referral code: ${referralCode}`);
    } else {
      referralCode = existingCode.code;
      console.log(`✅ Using existing referral code: ${referralCode}`);
    }

    console.log('\n📝 Step 4: Adding referral relationship...');
    
    const { data: newReferral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        code_used: referralCode,
        created_at: new Date().toISOString(),
        points_awarded: 0
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error adding referral relationship:', insertError.message);
      return;
    }
    
    console.log('✅ Successfully added referral relationship!');
    console.log('New referral:', newReferral);
    
    // Verify the referral was added
    console.log('\n📝 Step 5: Verifying referral was added...');
    
    const { data: verifyReferral, error: verifyError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying referral:', verifyError.message);
      return;
    }
    
    console.log('✅ Referral verified successfully!');
    console.log('Verified referral:', verifyReferral);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
addReferralRelationship()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });