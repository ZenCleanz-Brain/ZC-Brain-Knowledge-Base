// Simple in-memory store for pending edits
// In production, this would use a database like Vercel KV or PostgreSQL

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

// In-memory store (resets on server restart)
// For production, replace with database
const pendingEdits: Map<string, PendingEdit> = new Map();

export function generateId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createPendingEdit(edit: Omit<PendingEdit, 'id' | 'submittedAt' | 'status'>): PendingEdit {
  const id = generateId();
  const pendingEdit: PendingEdit = {
    ...edit,
    id,
    submittedAt: new Date(),
    status: 'pending',
  };
  pendingEdits.set(id, pendingEdit);
  return pendingEdit;
}

export function getPendingEdit(id: string): PendingEdit | undefined {
  return pendingEdits.get(id);
}

export function getAllPendingEdits(): PendingEdit[] {
  return Array.from(pendingEdits.values())
    .filter((edit) => edit.status === 'pending')
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export function getAllEdits(): PendingEdit[] {
  return Array.from(pendingEdits.values())
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export function updatePendingEdit(
  id: string,
  updates: Partial<PendingEdit>
): PendingEdit | null {
  const edit = pendingEdits.get(id);
  if (!edit) return null;

  const updated = { ...edit, ...updates };
  pendingEdits.set(id, updated);
  return updated;
}

export function deletePendingEdit(id: string): boolean {
  return pendingEdits.delete(id);
}

// Get pending edits for a specific file
export function getPendingEditsForFile(filePath: string): PendingEdit[] {
  return Array.from(pendingEdits.values())
    .filter((edit) => edit.filePath === filePath && edit.status === 'pending');
}
