import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getPendingEdit } from '@/lib/store';

interface RouteParams {
  params: { id: string };
}

// GET /api/edits/[id] - Get a specific pending edit
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const edit = await getPendingEdit(params.id);

  if (!edit) {
    return NextResponse.json({ error: 'Edit not found' }, { status: 404 });
  }

  const userRole = (session.user as any).role;
  const username = session.user?.name;

  // Only admin or the submitter can view the full edit
  if (userRole !== 'admin' && edit.submittedBy !== username) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  return NextResponse.json({ edit });
}
