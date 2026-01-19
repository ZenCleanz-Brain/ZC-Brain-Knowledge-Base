import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEdit, updatePendingEdit } from '@/lib/store';

interface RouteParams {
  params: { id: string };
}

// POST /api/edits/[id]/reject - Reject a pending edit (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can reject edits' },
      { status: 403 }
    );
  }

  const edit = getPendingEdit(params.id);

  if (!edit) {
    return NextResponse.json({ error: 'Edit not found' }, { status: 404 });
  }

  if (edit.status !== 'pending') {
    return NextResponse.json(
      { error: 'Edit has already been processed' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reviewNote = body.note || '';

    // Update the edit status
    updatePendingEdit(params.id, {
      status: 'rejected',
      reviewedBy: session.user?.name || 'Admin',
      reviewedAt: new Date(),
      reviewNote,
    });

    return NextResponse.json({
      status: 'rejected',
      message: 'Edit rejected',
    });
  } catch (error) {
    console.error('Error rejecting edit:', error);
    return NextResponse.json(
      { error: 'Failed to reject edit' },
      { status: 500 }
    );
  }
}
