#!/usr/bin/env node

/**
 * Check Pending Edits in Supabase
 *
 * Shows all pending edits currently in the database
 * Usage: node check-pending-edits.js
 */

require('dotenv').config({ path: '.env' });

(async () => {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking Pending Edits in Supabase\n');
  console.log('='.repeat(70));

  // Get all edits
  const { data: allEdits, error: allError } = await supabase
    .from('pending_edits')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (allError) {
    console.log('\n❌ Error fetching edits:', allError.message);
    process.exit(1);
  }

  console.log(`\n📊 Total edits in database: ${allEdits?.length || 0}`);

  if (!allEdits || allEdits.length === 0) {
    console.log('\n📝 No edits found in the database yet.');
    console.log('\n💡 This is normal if:');
    console.log('   - You haven\'t made any edits as an editor yet');
    console.log('   - All edits were made as admin (commits directly to GitHub)');
    console.log('   - The database was recently set up');
    process.exit(0);
  }

  // Group by status
  const pending = allEdits.filter((e) => e.status === 'pending');
  const approved = allEdits.filter((e) => e.status === 'approved');
  const rejected = allEdits.filter((e) => e.status === 'rejected');

  console.log(`\n   ⏳ Pending: ${pending.length}`);
  console.log(`   ✅ Approved: ${approved.length}`);
  console.log(`   ❌ Rejected: ${rejected.length}`);

  // Show pending edits
  if (pending.length > 0) {
    console.log('\n\n📋 PENDING EDITS (Awaiting Review):');
    console.log('='.repeat(70));

    pending.forEach((edit, idx) => {
      console.log(`\n${idx + 1}. ${edit.file_name}`);
      console.log(`   ID: ${edit.id}`);
      console.log(`   Path: ${edit.file_path}`);
      console.log(`   By: ${edit.submitted_by}`);
      console.log(`   Date: ${new Date(edit.submitted_at).toLocaleString()}`);
      console.log(`   Status: ${edit.status}`);
    });
  }

  // Show recent approved
  if (approved.length > 0) {
    console.log('\n\n✅ RECENT APPROVED EDITS:');
    console.log('='.repeat(70));

    approved.slice(0, 5).forEach((edit, idx) => {
      console.log(`\n${idx + 1}. ${edit.file_name}`);
      console.log(`   By: ${edit.submitted_by}`);
      console.log(`   Approved by: ${edit.reviewed_by || 'Unknown'}`);
      console.log(`   Date: ${new Date(edit.submitted_at).toLocaleString()}`);
    });

    if (approved.length > 5) {
      console.log(`\n   ... and ${approved.length - 5} more approved edits`);
    }
  }

  // Show recent rejected
  if (rejected.length > 0) {
    console.log('\n\n❌ RECENT REJECTED EDITS:');
    console.log('='.repeat(70));

    rejected.slice(0, 3).forEach((edit, idx) => {
      console.log(`\n${idx + 1}. ${edit.file_name}`);
      console.log(`   By: ${edit.submitted_by}`);
      console.log(`   Rejected by: ${edit.reviewed_by || 'Unknown'}`);
      console.log(`   Reason: ${edit.review_note || 'No reason provided'}`);
      console.log(`   Date: ${new Date(edit.submitted_at).toLocaleString()}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Database check complete!\n');
})();
