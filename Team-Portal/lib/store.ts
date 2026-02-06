// Supabase-based store for pending edits
import { supabase } from './supabase';

export interface PendingEdit {
  id: string;
  filePath: string;
  fileName: string;
  originalContent: string;
  newContent: string;
  originalSha: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
}

// Map database row to PendingEdit
function mapRow(row: any): PendingEdit {
  return {
    id: row.id,
    filePath: row.file_path,
    fileName: row.file_name,
    originalContent: row.original_content,
    newContent: row.new_content,
    originalSha: row.original_sha,
    submittedBy: row.submitted_by,
    submittedAt: new Date(row.submitted_at),
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    reviewNote: row.review_note,
  };
}

export function generateId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function createPendingEdit(
  edit: Omit<PendingEdit, 'id' | 'submittedAt' | 'status'>
): Promise<PendingEdit> {
  const id = generateId();

  const { data, error } = await supabase
    .from('pending_edits')
    .insert({
      id,
      file_path: edit.filePath,
      file_name: edit.fileName,
      original_content: edit.originalContent,
      new_content: edit.newContent,
      original_sha: edit.originalSha,
      submitted_by: edit.submittedBy,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[Store] Error creating pending edit:', error);
    throw error;
  }

  console.log('[Store] Created pending edit:', id, 'for file:', edit.filePath);
  return mapRow(data);
}

// Create an auto-approved edit record for admin direct commits
// This ensures admin changes appear in Recent Activity and Approved sections
export async function createAutoApprovedEdit(
  edit: Omit<PendingEdit, 'id' | 'status'> & {
    submittedAt: Date;
    reviewedBy: string;
    reviewedAt: Date;
    reviewNote: string;
  }
): Promise<PendingEdit> {
  const id = generateId();

  const { data, error } = await supabase
    .from('pending_edits')
    .insert({
      id,
      file_path: edit.filePath,
      file_name: edit.fileName,
      original_content: edit.originalContent,
      new_content: edit.newContent,
      original_sha: edit.originalSha,
      submitted_by: edit.submittedBy,
      submitted_at: edit.submittedAt.toISOString(),
      status: 'approved',  // Auto-approved for admin direct commits
      reviewed_by: edit.reviewedBy,
      reviewed_at: edit.reviewedAt.toISOString(),
      review_note: edit.reviewNote,
    })
    .select()
    .single();

  if (error) {
    console.error('[Store] Error creating auto-approved edit:', error);
    throw error;
  }

  console.log('[Store] Created auto-approved edit:', id, 'for file:', edit.filePath);
  return mapRow(data);
}

// Create a revert record for tracking when approved edits are reverted
// This ensures revert actions appear in Recent Activity
export async function createRevertRecord(
  edit: {
    filePath: string;
    fileName: string;
    originalContent: string;  // Content before revert (the approved content)
    newContent: string;       // Content after revert (reverted to original)
    originalSha: string;
    originalEditBy: string;   // Who made the original edit that's being reverted
    revertedBy: string;       // Admin who performed the revert
    revertedAt: Date;
  }
): Promise<PendingEdit> {
  const id = generateId();

  const { data, error } = await supabase
    .from('pending_edits')
    .insert({
      id,
      file_path: edit.filePath,
      file_name: edit.fileName,
      original_content: edit.originalContent,
      new_content: edit.newContent,
      original_sha: edit.originalSha,
      submitted_by: edit.revertedBy,  // The reverter is the "submitter" of this action
      submitted_at: edit.revertedAt.toISOString(),
      status: 'approved',  // Revert is an approved action (it was committed)
      reviewed_by: edit.revertedBy,
      reviewed_at: edit.revertedAt.toISOString(),
      review_note: `Reverted (original edit by ${edit.originalEditBy})`,
    })
    .select()
    .single();

  if (error) {
    console.error('[Store] Error creating revert record:', error);
    throw error;
  }

  console.log('[Store] Created revert record:', id, 'for file:', edit.filePath);
  return mapRow(data);
}

// Create a delete record for tracking when files are permanently deleted
// This ensures delete actions appear in Recent Activity
export async function createDeleteRecord(
  edit: {
    filePath: string;
    fileName: string;
    originalContent: string;  // The content that was deleted
    originalSha: string;
    deletedBy: string;        // Admin who performed the delete
    deletedAt: Date;
  }
): Promise<PendingEdit> {
  const id = generateId();

  const { data, error } = await supabase
    .from('pending_edits')
    .insert({
      id,
      file_path: edit.filePath,
      file_name: edit.fileName,
      original_content: edit.originalContent,
      new_content: '',  // Empty - file was deleted
      original_sha: edit.originalSha,
      submitted_by: edit.deletedBy,
      submitted_at: edit.deletedAt.toISOString(),
      status: 'approved',  // Delete is a committed action
      reviewed_by: edit.deletedBy,
      reviewed_at: edit.deletedAt.toISOString(),
      review_note: 'File permanently deleted',
    })
    .select()
    .single();

  if (error) {
    console.error('[Store] Error creating delete record:', error);
    throw error;
  }

  console.log('[Store] Created delete record:', id, 'for file:', edit.filePath);
  return mapRow(data);
}

export async function getPendingEdit(id: string): Promise<PendingEdit | null> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Store] Error getting pending edit:', error);
    return null;
  }

  return data ? mapRow(data) : null;
}

export async function getAllPendingEdits(): Promise<PendingEdit[]> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[Store] Error getting all pending edits:', error);
    return [];
  }

  return data.map(mapRow);
}

export async function getAllEdits(): Promise<PendingEdit[]> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[Store] Error getting all edits:', error);
    return [];
  }

  return data.map(mapRow);
}

export async function updatePendingEdit(
  id: string,
  updates: Partial<PendingEdit>
): Promise<PendingEdit | null> {
  const dbUpdates: any = {};

  if (updates.status) dbUpdates.status = updates.status;
  if (updates.reviewedBy) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.reviewedAt) dbUpdates.reviewed_at = updates.reviewedAt.toISOString();
  if (updates.reviewNote !== undefined) dbUpdates.review_note = updates.reviewNote;

  const { data, error } = await supabase
    .from('pending_edits')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Store] Error updating pending edit:', error);
    return null;
  }

  console.log('[Store] Updated pending edit:', id);
  return data ? mapRow(data) : null;
}

export async function deletePendingEdit(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_edits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Store] Error deleting pending edit:', error);
    return false;
  }

  console.log('[Store] Deleted pending edit:', id);
  return true;
}

// Get pending edits for a specific file (ordered by submission time, oldest first)
export async function getPendingEditsForFile(filePath: string): Promise<PendingEdit[]> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('file_path', filePath)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true }); // Oldest first for proper chaining

  if (error) {
    console.error('[Store] Error getting pending edits for file:', error);
    return [];
  }

  return data.map(mapRow);
}

// Get the latest pending edit for a file (most recent submission)
export async function getLatestPendingEditForFile(filePath: string): Promise<PendingEdit | null> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('file_path', filePath)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found - not an error
      return null;
    }
    console.error('[Store] Error getting latest pending edit:', error);
    return null;
  }

  return data ? mapRow(data) : null;
}

// Get the first (oldest) pending edit for a file
export async function getFirstPendingEditForFile(filePath: string): Promise<PendingEdit | null> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('file_path', filePath)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Store] Error getting first pending edit:', error);
    return null;
  }

  return data ? mapRow(data) : null;
}

// ─── Saved Answers ───────────────────────────────────────

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  savedBy: string;
  savedAt: Date;
  sessionId: string;
}

function mapSavedAnswerRow(row: any): SavedAnswer {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    savedBy: row.saved_by,
    savedAt: new Date(row.saved_at),
    sessionId: row.session_id,
  };
}

export async function saveAnswers(
  answers: Array<{ question: string; answer: string }>,
  savedBy: string,
  sessionId: string
): Promise<SavedAnswer[]> {
  const rows = answers.map((a) => ({
    question: a.question,
    answer: a.answer,
    saved_by: savedBy,
    session_id: sessionId,
  }));

  const { data, error } = await supabase
    .from('saved_answers')
    .insert(rows)
    .select();

  if (error) {
    console.error('[Store] Error saving answers:', error);
    throw error;
  }

  console.log('[Store] Saved', data.length, 'answers for session:', sessionId);
  return data.map(mapSavedAnswerRow);
}

export async function getSavedAnswers(): Promise<SavedAnswer[]> {
  const { data, error } = await supabase
    .from('saved_answers')
    .select('*')
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('[Store] Error getting saved answers:', error);
    return [];
  }

  return data.map(mapSavedAnswerRow);
}

export async function deleteSavedAnswer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_answers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Store] Error deleting saved answer:', error);
    return false;
  }

  console.log('[Store] Deleted saved answer:', id);
  return true;
}
