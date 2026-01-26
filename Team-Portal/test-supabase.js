#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Tool
 *
 * Run this to check if your Supabase credentials are valid
 * Usage: node test-supabase.js
 */

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Connection Diagnostic\n');
console.log('=' .repeat(60));

// Check URL
console.log('\n📍 Supabase URL:');
if (!supabaseUrl) {
  console.log('   ❌ MISSING! Add NEXT_PUBLIC_SUPABASE_URL to .env');
} else if (supabaseUrl.includes('xxxxx')) {
  console.log('   ⚠️  Masked in logs (normal for security)');
  console.log('   ℹ️  Actual value:', supabaseUrl);
} else {
  console.log('   ✅', supabaseUrl);

  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    if (!url.hostname.endsWith('.supabase.co')) {
      console.log('   ⚠️  URL doesn\'t look like a Supabase URL');
    }
  } catch (e) {
    console.log('   ❌ Invalid URL format');
  }
}

// Check API Key
console.log('\n🔑 Supabase API Key:');
if (!supabaseKey) {
  console.log('   ❌ MISSING! Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env');
} else {
  console.log('   ℹ️  Length:', supabaseKey.length, 'characters');
  console.log('   ℹ️  Starts with:', supabaseKey.substring(0, 10) + '...');

  // Validate key format
  if (supabaseKey.length < 100) {
    console.log('   ❌ TOO SHORT! Anon key should be 200-300 characters');
    console.log('   ℹ️  Your key appears to be incomplete or truncated');
  } else if (!supabaseKey.startsWith('eyJ')) {
    console.log('   ⚠️  Doesn\'t start with "eyJ" - might not be the anon key');
    console.log('   ℹ️  Make sure you copied the "anon public" key, not service_role');
  } else {
    console.log('   ✅ Key format looks correct!');
  }
}

// Test connection
console.log('\n🌐 Testing Connection:');

if (supabaseUrl && supabaseKey) {
  (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('   ⏳ Attempting to connect...');

      // Try to query the pending_edits table
      const { data, error } = await supabase
        .from('pending_edits')
        .select('count')
        .limit(1);

      if (error) {
        console.log('   ❌ Connection FAILED!');
        console.log('\n   Error details:');
        console.log('   ', error.message);
        if (error.hint) {
          console.log('   💡 Hint:', error.hint);
        }

        if (error.message.includes('Invalid API key')) {
          console.log('\n   🔧 FIX: Get your anon public key from Supabase dashboard');
          console.log('       → Settings → API → "anon public" key');
        } else if (error.message.includes('relation "pending_edits" does not exist')) {
          console.log('\n   🔧 FIX: Create the pending_edits table');
          console.log('       → See SUPABASE-SETUP-GUIDE.md Step 3');
        }
      } else {
        console.log('   ✅ Connection SUCCESSFUL!');
        console.log('   ✅ pending_edits table exists');
        console.log('\n   🎉 Your Supabase is configured correctly!');
      }
    } catch (e) {
      console.log('   ❌ Connection test failed:');
      console.log('   ', e.message);

      if (e.message.includes('ENOTFOUND')) {
        console.log('\n   🔧 FIX: Check your NEXT_PUBLIC_SUPABASE_URL');
        console.log('       Make sure it matches your project URL in Supabase dashboard');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📚 For detailed setup instructions, see: SUPABASE-SETUP-GUIDE.md\n');
  })();
} else {
  console.log('   ⏭️  Skipped (missing credentials)\n');
  console.log('='.repeat(60));
  console.log('\n🔧 Next Steps:');
  console.log('   1. Add your Supabase credentials to .env file');
  console.log('   2. See SUPABASE-SETUP-GUIDE.md for instructions');
  console.log('   3. Run this script again: node test-supabase.js\n');
}
