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

// Get pending edits for a specific file
export async function getPendingEditsForFile(filePath: string): Promise<PendingEdit[]> {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('file_path', filePath)
    .eq('status', 'pending');

  if (error) {
    console.error('[Store] Error getting pending edits for file:', error);
    return [];
  }

  return data.map(mapRow);
}
