import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllPendingEdits, getAllEdits } from '@/lib/store';

// GET /api/edits - List all pending edits
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Admins can see all edits, others can see only pending
  const edits = userRole === 'admin' ? await getAllEdits() : await getAllPendingEdits();

  return NextResponse.json({
    edits: edits.map((edit) => ({
      id: edit.id,
      filePath: edit.filePath,
      fileName: edit.fileName,
      submittedBy: edit.submittedBy,
      submittedAt: edit.submittedAt,
      status: edit.status,
      reviewedBy: edit.reviewedBy,
      reviewedAt: edit.reviewedAt,
      reviewNote: edit.reviewNote,
    })),
  });
}
