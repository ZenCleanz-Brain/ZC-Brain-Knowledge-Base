// Test Supabase connection
// Run with: node scripts/test-supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET');
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('\nExpected key format: eyJ... (JWT token, usually 200-300 characters)\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Supabase credentials not found in .env file');
  console.log('\nPlease add to your .env file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Attempting to query pending_edits table...');

    const { data, error } = await supabase
      .from('pending_edits')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ ERROR:', error.message);
      console.error('\nDetails:', error);

      if (error.message.includes('JWT') || error.message.includes('API key')) {
        console.log('\n⚠️  Your Supabase anon key appears to be invalid or incomplete.');
        console.log('\nTo get your correct key:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click "Settings" → "API"');
        console.log('4. Copy the "anon" "public" key (it should be very long, 200-300 characters)');
        console.log('5. Update your .env file with the complete key');
      }

      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('\n⚠️  The "pending_edits" table does not exist.');
        console.log('\nTo create the table:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click "SQL Editor"');
        console.log('4. Run the SQL from: scripts/setup-supabase.sql');
      }

      return false;
    }

    console.log('✅ SUCCESS! Connected to Supabase');
    console.log('Table "pending_edits" exists and is accessible');
    console.log('Records found:', data ? data.length : 0);
    return true;

  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✅ Supabase is properly configured!');
    process.exit(0);
  } else {
    console.log('\n❌ Supabase configuration needs attention. See errors above.');
    process.exit(1);
  }
});
