import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteSavedAnswer } from '@/lib/store';

// DELETE /api/saved-answers/[id] - Delete a saved answer
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role || 'viewer';
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing answer ID' },
        { status: 400 }
      );
    }

    const success = await deleteSavedAnswer(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete answer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved answer:', error);
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    );
  }
}
